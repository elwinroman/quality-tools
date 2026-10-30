import { Logger } from '@observability/domain/logger'
import { GetSysObjectDependentsUseCase } from '@sysobject/application/use-cases/get-sysobject-dependents.use-case'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SysObjectDependent, SysObjectRelationsResult, SysObjectRelationsWarning } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

interface LogEntry {
  message: string
  context?: Record<string, unknown>
}

function createFakeLogger() {
  const infoCalls: LogEntry[] = []
  const warnCalls: LogEntry[] = []

  const logger: Logger = {
    debug: () => undefined,
    info: (message, context) => {
      infoCalls.push({ message, context })
    },
    warn: (message, context) => {
      warnCalls.push({ message, context })
    },
    error: () => undefined,
    fatal: () => undefined,
  }

  return { logger, infoCalls, warnCalls }
}

function createFakeSysObjectRepository(overrides: Partial<ForSysObjectRepositoryPort> = {}): ForSysObjectRepositoryPort {
  return {
    getBySchemaAndName: async () => null,
    getRolesById: async () => [],
    findByNameAndType: async () => [],
    findDependentsBySchemaAndName: async () => ({ data: [] }),
    findDependenciesBySchemaAndName: async () => ({ data: [] }),
    ...overrides,
  }
}

const DEPENDENT: SysObjectDependent = { id: 901, name: 'usp_GetOrders', schemaName: 'dbo', typeDesc: 'SQL_STORED_PROCEDURE' }

const WARNING: SysObjectRelationsWarning = {
  type: 'DependencyMetadataFallback',
  detail: 'Sin permiso para consultar sys.dm_sql_referencing_entities',
  source: 'sys.dm_sql_referencing_entities',
  fallbackSource: 'sys.sql_expression_dependencies',
}

describe('GetSysObjectDependentsUseCase', () => {
  describe('resultado sin fallback', () => {
    it('debería devolver el resultado del repositorio y registrar solo el info con el conteo', async () => {
      const requested: Array<{ name: string; schema: string }> = []
      const result: SysObjectRelationsResult<SysObjectDependent> = { data: [DEPENDENT] }
      const repository = createFakeSysObjectRepository({
        findDependentsBySchemaAndName: async (name, schema) => {
          requested.push({ name, schema })
          return result
        },
      })
      const { logger, infoCalls, warnCalls } = createFakeLogger()
      const useCase = new GetSysObjectDependentsUseCase(repository, logger)

      await expect(useCase.execute(DEPENDENT.name, 'dbo')).resolves.toEqual(result)

      expect(requested).toEqual([{ name: DEPENDENT.name, schema: 'dbo' }])
      expect(warnCalls).toHaveLength(0)
      expect(infoCalls).toHaveLength(1)
      expect(infoCalls[0].context).toMatchObject({ actionDetails: { resultsCount: result.data.length } })
    })

    it('debería devolver una colección vacía cuando no hay referencias', async () => {
      const result: SysObjectRelationsResult<SysObjectDependent> = { data: [] }
      const repository = createFakeSysObjectRepository({ findDependentsBySchemaAndName: async () => result })
      const { logger, infoCalls, warnCalls } = createFakeLogger()
      const useCase = new GetSysObjectDependentsUseCase(repository, logger)

      await expect(useCase.execute(DEPENDENT.name, 'dbo')).resolves.toEqual(result)

      expect(warnCalls).toHaveLength(0)
      expect(infoCalls[0].context).toMatchObject({ actionDetails: { resultsCount: 0 } })
    })
  })

  describe('resultado con fallback', () => {
    it('debería registrar el warning y propagar la meta del repositorio', async () => {
      const result: SysObjectRelationsResult<SysObjectDependent> = { data: [DEPENDENT], meta: { warning: WARNING } }
      const repository = createFakeSysObjectRepository({ findDependentsBySchemaAndName: async () => result })
      const { logger, infoCalls, warnCalls } = createFakeLogger()
      const useCase = new GetSysObjectDependentsUseCase(repository, logger)

      await expect(useCase.execute(DEPENDENT.name, 'dbo')).resolves.toEqual(result)

      expect(warnCalls).toHaveLength(1)
      expect(warnCalls[0].context).toMatchObject({ actionDetails: { warning: WARNING } })
      expect(infoCalls).toHaveLength(1)
    })
  })
})
