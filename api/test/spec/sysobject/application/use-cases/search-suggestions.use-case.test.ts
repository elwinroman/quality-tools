import { Logger } from '@observability/domain/logger'
import { SearchSuggestionsUseCase } from '@sysobject/application/use-cases/search-suggestions.use-case'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SysObjectSummary, TypeSysObjectEnum, ValidTypeSysObject, ValidTypeSysObjectValues } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

interface LogEntry {
  message: string
  context?: Record<string, unknown>
}

function createFakeLogger() {
  const infoCalls: LogEntry[] = []

  const logger: Logger = {
    debug: () => undefined,
    info: (message, context) => {
      infoCalls.push({ message, context })
    },
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
  }

  return { logger, infoCalls }
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

const SUGGESTIONS: SysObjectSummary[] = [{ id: 1, name: 'vw_orders', schemaName: 'dbo', typeDesc: 'VIEW' }]

function buildCallRecorder(result: SysObjectSummary[] = SUGGESTIONS) {
  const calls: Array<{ name: string; types: ValidTypeSysObject[] }> = []
  const repository = createFakeSysObjectRepository({
    findByNameAndType: async (name, types) => {
      calls.push({ name, types })
      return result
    },
  })
  return { repository, calls }
}

describe('SearchSuggestionsUseCase', () => {
  describe('tipo concreto', () => {
    it('debería delegar un único tipo y devolver las sugerencias registrando el conteo', async () => {
      const { repository, calls } = buildCallRecorder()
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new SearchSuggestionsUseCase(repository, logger)

      const result = await useCase.execute('ord', TypeSysObjectEnum.VIEW)

      expect(result).toEqual(SUGGESTIONS)
      expect(calls).toEqual([{ name: 'ord', types: [TypeSysObjectEnum.VIEW] }])
      expect(infoCalls).toHaveLength(1)
      expect(infoCalls[0].context).toMatchObject({
        actionDetails: { searchTerm: 'ord', type: TypeSysObjectEnum.VIEW, resultsCount: SUGGESTIONS.length },
      })
    })
  })

  describe('tipos agregados', () => {
    it('debería expandir ALL a todos los tipos válidos', async () => {
      const { repository, calls } = buildCallRecorder()
      const useCase = new SearchSuggestionsUseCase(repository, createFakeLogger().logger)

      await useCase.execute('ord', TypeSysObjectEnum.ALL)

      expect(calls).toEqual([{ name: 'ord', types: ValidTypeSysObjectValues }])
    })

    it('debería expandir ALL_EXCEPT_USERTABLE excluyendo el tipo USER_TABLE', async () => {
      const { repository, calls } = buildCallRecorder()
      const useCase = new SearchSuggestionsUseCase(repository, createFakeLogger().logger)

      await useCase.execute('ord', TypeSysObjectEnum.ALL_EXCEPT_USERTABLE)

      expect(calls).toEqual([{ name: 'ord', types: ValidTypeSysObjectValues.filter(type => type !== TypeSysObjectEnum.USER_TABLE) }])
    })
  })

  describe('sin coincidencias', () => {
    it('debería devolver una colección vacía y registrar conteo cero', async () => {
      const { repository } = buildCallRecorder([])
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new SearchSuggestionsUseCase(repository, logger)

      await expect(useCase.execute('zzz', TypeSysObjectEnum.ALL)).resolves.toEqual([])

      expect(infoCalls[0].context).toMatchObject({ actionDetails: { resultsCount: 0 } })
    })
  })
})
