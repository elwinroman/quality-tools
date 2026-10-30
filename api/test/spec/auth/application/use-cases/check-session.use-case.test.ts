import { CheckSessionUseCase } from '@auth/application/use-cases/check-session.use-case'
import { ForStoreRepositoryPort } from '@auth/domain/ports/drivens/for-store-repository.port'
import { Logger } from '@observability/domain/logger'
import { StoreUserSchema } from '@shared/domain/store'
import { describe, expect, it } from 'vitest'

function createFakeStoreRepository(overrides: Partial<ForStoreRepositoryPort> = {}): ForStoreRepositoryPort {
  return {
    getDetails: async () => {
      throw new Error('getDetails no debería invocarse')
    },
    getPermission: async () => ({ viewdefinitionPermission: false }),
    getDatabases: async () => [],
    ...overrides,
  }
}

function createFakeLogger() {
  const infoCalls: string[] = []

  const logger: Logger = {
    debug: () => undefined,
    info: message => {
      infoCalls.push(message)
    },
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
  }

  return { logger, infoCalls }
}

const CREDENTIALS: StoreUserSchema = {
  host: 'db-host',
  database: 'QualityTools',
  user: 'analista',
  password: 'secret',
}

describe('CheckSessionUseCase', () => {
  describe('verificación correcta', () => {
    it('debería delegar las credenciales y mapear el permiso de VIEW DEFINITION', async () => {
      const received: StoreUserSchema[] = []
      const storeRepository = createFakeStoreRepository({
        getPermission: async credential => {
          received.push(credential)
          return { viewdefinitionPermission: true }
        },
      })
      const useCase = new CheckSessionUseCase(storeRepository, createFakeLogger().logger)

      const status = await useCase.execute(CREDENTIALS)

      expect(received).toEqual([CREDENTIALS])
      expect(status.databaseConnection).toBe('connected')
      expect(status.viewdefinitionPermission).toBe(true)
      expect(status.checkedAt).toBeInstanceOf(Date)
      expect(status.database).toBe('QualityTools')
    })

    it('debería exponer la base de datos activa recibida en las credenciales', async () => {
      const storeRepository = createFakeStoreRepository()
      const useCase = new CheckSessionUseCase(storeRepository, createFakeLogger().logger)
      const credentials: StoreUserSchema = { ...CREDENTIALS, database: 'OtraBase' }

      const status = await useCase.execute(credentials)

      expect(status.database).toBe('OtraBase')
    })

    it('debería registrar la verificación de sesión', async () => {
      const storeRepository = createFakeStoreRepository()
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new CheckSessionUseCase(storeRepository, logger)

      await useCase.execute(CREDENTIALS)

      // El arreglo sólo captura nivel `info`: fija a la vez el nivel y el mensaje del evento.
      expect(infoCalls).toEqual(['[auth] Sesión verificada'])
    })
  })
})
