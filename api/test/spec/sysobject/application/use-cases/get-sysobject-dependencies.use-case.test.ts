import { Logger } from '@observability/domain/logger'
import { GetSysObjectDependenciesUseCase } from '@sysobject/application/use-cases/get-sysobject-dependencies.use-case'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SysObjectDependency, SysObjectRelationsResult, SysObjectRelationsWarning } from '@sysobject/domain/schemas/sysobject'
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

const DEPENDENCY: SysObjectDependency = { id: 900, name: 'Orders', schemaName: 'dbo', typeDesc: 'USER_TABLE' }

const WARNING: SysObjectRelationsWarning = {
  type: 'DependencyMetadataFallback',
  detail: 'Sin permiso para consultar sys.dm_sql_referenced_entities',
  source: 'sys.dm_sql_referenced_entities',
  fallbackSource: 'sys.sql_expression_dependencies',
}

describe('GetSysObjectDependenciesUseCase', () => {
  describe('resultado sin fallback', () => {
    it('debería devolver el resultado del repositorio y registrar solo el info con el conteo', async () => {
      const requested: Array<{ name: string; schema: string }> = []
      const result: SysObjectRelationsResult<SysObjectDependency> = { data: [DEPENDENCY] }
      const repository = createFakeSysObjectRepository({
        findDependenciesBySchemaAndName: async (name, schema) => {
          requested.push({ name, schema })
          return result
        },
      })
      const { logger, infoCalls, warnCalls } = createFakeLogger()
      const useCase = new GetSysObjectDependenciesUseCase(repository, logger)

      await expect(useCase.execute(DEPENDENCY.name, 'dbo')).resolves.toEqual(result)

      expect(requested).toEqual([{ name: DEPENDENCY.name, schema: 'dbo' }])
      expect(warnCalls).toHaveLength(0)
      expect(infoCalls).toHaveLength(1)
      expect(infoCalls[0].context).toMatchObject({ actionDetails: { resultsCount: result.data.length } })
    })

    it('debería devolver una colección vacía cuando no hay dependencias', async () => {
      const result: SysObjectRelationsResult<SysObjectDependency> = { data: [] }
      const repository = createFakeSysObjectRepository({ findDependenciesBySchemaAndName: async () => result })
      const { logger, infoCalls, warnCalls } = createFakeLogger()
      const useCase = new GetSysObjectDependenciesUseCase(repository, logger)

      await expect(useCase.execute(DEPENDENCY.name, 'dbo')).resolves.toEqual(result)

      expect(warnCalls).toHaveLength(0)
      expect(infoCalls[0].context).toMatchObject({ actionDetails: { resultsCount: 0 } })
    })
  })

  describe('resultado con fallback', () => {
    it('debería registrar el warning y propagar la meta del repositorio', async () => {
      const result: SysObjectRelationsResult<SysObjectDependency> = { data: [DEPENDENCY], meta: { warning: WARNING } }
      const repository = createFakeSysObjectRepository({ findDependenciesBySchemaAndName: async () => result })
      const { logger, infoCalls, warnCalls } = createFakeLogger()
      const useCase = new GetSysObjectDependenciesUseCase(repository, logger)

      await expect(useCase.execute(DEPENDENCY.name, 'dbo')).resolves.toEqual(result)

      expect(warnCalls).toHaveLength(1)
      expect(warnCalls[0].context).toMatchObject({ actionDetails: { warning: WARNING } })
      expect(infoCalls).toHaveLength(1)
    })
  })
})
