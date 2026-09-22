import { Logger } from '@observability/domain/logger'
import { TIPO_ACCION } from '@sysobject/application/constants/action-type.constant'
import { RegisterSearchLogUseCase } from '@sysobject/application/use-cases/register-search-log.use-case'
import { ForLogRepositoryPort, SearchLog } from '@sysobject/domain/ports/drivens/for-log-repository.port'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { RegisterSearchLogErrorException } from '@sysobject/infrastructure/exceptions/register-search-log-error.exception'
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

function createFakeLogRepository(result: boolean) {
  const created: SearchLog[] = []

  const repository: ForLogRepositoryPort = {
    createSearchLog: async searchLog => {
      created.push(searchLog)
      return result
    },
  }

  return { repository, created }
}

const SEARCH_LOG: SearchLog = {
  idUser: 42,
  actionType: TIPO_ACCION.BusquedaRegular,
  database: 'QualityTools',
  schema: 'dbo',
  search: 'vw_orders',
  type: TypeSysObjectEnum.VIEW,
  isProduction: false,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
}

describe('RegisterSearchLogUseCase', () => {
  describe('registro correcto', () => {
    it('debería delegar el log de búsqueda y registrar el evento', async () => {
      const { repository, created } = createFakeLogRepository(true)
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new RegisterSearchLogUseCase(repository, logger)

      await expect(useCase.execute(SEARCH_LOG)).resolves.toBeUndefined()

      expect(created).toEqual([SEARCH_LOG])
      expect(infoCalls).toHaveLength(1)
    })
  })

  describe('fallo de persistencia', () => {
    it('debería lanzar RegisterSearchLogErrorException con el identificador del objeto y sin registrar el evento', async () => {
      const { repository, created } = createFakeLogRepository(false)
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new RegisterSearchLogUseCase(repository, logger)

      const error = await useCase.execute(SEARCH_LOG).catch(caught => caught)

      expect(created).toEqual([SEARCH_LOG])
      expect(error).toBeInstanceOf(RegisterSearchLogErrorException)
      expect(error.message).toContain(`${SEARCH_LOG.schema}.${SEARCH_LOG.search}`)
      expect(infoCalls).toHaveLength(0)
    })
  })
})
