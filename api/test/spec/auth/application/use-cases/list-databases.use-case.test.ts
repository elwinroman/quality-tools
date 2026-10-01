import { ListDatabasesUseCase } from '@auth/application/use-cases/list-databases.use-case'
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

const CREDENTIALS: Omit<StoreUserSchema, 'database'> = {
  host: 'db-host',
  user: 'analista',
  password: 'secret',
}

describe('ListDatabasesUseCase', () => {
  describe('consulta correcta', () => {
    it('debería forzar la base de datos master al consultar el repositorio', async () => {
      const received: StoreUserSchema[] = []
      const storeRepository = createFakeStoreRepository({
        getDatabases: async credential => {
          received.push(credential)
          return ['QualityTools']
        },
      })
      const useCase = new ListDatabasesUseCase(storeRepository, createFakeLogger().logger)

      await useCase.execute(CREDENTIALS)

      expect(received).toEqual([{ ...CREDENTIALS, database: 'master' }])
    })

    it('debería devolver la lista y registrar el evento cuando el repositorio responde', async () => {
      const databaseList = ['QualityTools', 'master']
      const storeRepository = createFakeStoreRepository({ getDatabases: async () => databaseList })
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new ListDatabasesUseCase(storeRepository, logger)

      await expect(useCase.execute(CREDENTIALS)).resolves.toEqual(databaseList)
      // El arreglo sólo captura nivel `info`: fija a la vez el nivel y el mensaje del evento.
      expect(infoCalls).toEqual(['[auth] Lista de base de datos obtenida'])
    })
  })

  describe('repositorio sin lista', () => {
    it('debería lanzar Error y no registrar el evento cuando el repositorio devuelve null', async () => {
      const storeRepository = createFakeStoreRepository({ getDatabases: async () => null })
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new ListDatabasesUseCase(storeRepository, logger)

      await expect(useCase.execute(CREDENTIALS)).rejects.toThrow('No tienes ninguna lista de base de datos')
      expect(infoCalls).toHaveLength(0)
    })
  })
})
