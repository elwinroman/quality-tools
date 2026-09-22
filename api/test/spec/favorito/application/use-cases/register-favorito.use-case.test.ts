import { RegisterFavoritoUseCase } from '@favorito/application/use-cases/register-favorito.use-case'
import { FavoritoAlreadyExistsException } from '@favorito/domain/exceptions/favorito-already-exists.exception'
import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { Criteria, FavoritoInput, FavoritoRepoInput, FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
import { Logger } from '@observability/domain/logger'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
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

function createFakeRepository(overrides: Partial<ForFavoritoRepositoryPort> = {}): ForFavoritoRepositoryPort {
  return {
    createOrUpdate: async () => null,
    deleteById: async () => false,
    existsByCriteria: async () => false,
    findMany: async () => ({ data: [], meta: { limit: 0, total: 0 } }),
    getById: async () => null,
    ...overrides,
  }
}

const FAVORITO_INPUT: FavoritoInput = {
  idUser: 7,
  schema: 'dbo',
  objectName: 'vw_orders',
  type: TypeSysObjectEnum.VIEW,
}

const REPOSITORY_RESPONSE: FavoritoRepoResponse = {
  id: 101,
  schema: FAVORITO_INPUT.schema,
  objectName: FAVORITO_INPUT.objectName,
  date: new Date('2026-01-01T00:00:00.000Z'),
  type: FAVORITO_INPUT.type,
}

describe('RegisterFavoritoUseCase', () => {
  describe('registro de un favorito nuevo', () => {
    it('debería persistir con fecha e isActive y devolver la acción INSERT', async () => {
      const persisted: FavoritoRepoInput[] = []
      const repository = createFakeRepository({
        createOrUpdate: async input => {
          persisted.push(input)
          return { action: 'INSERT', data: REPOSITORY_RESPONSE }
        },
      })
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new RegisterFavoritoUseCase(repository, logger)

      const result = await useCase.execute(FAVORITO_INPUT)

      expect(persisted).toHaveLength(1)
      expect(persisted[0]).toMatchObject({ ...FAVORITO_INPUT, isActive: true })
      expect(persisted[0].date).toBeInstanceOf(Date)
      expect(result).toEqual({ action: 'INSERT', data: REPOSITORY_RESPONSE, message: 'Favorito creado correctamente' })
      expect(infoCalls).toHaveLength(1)
    })

    it('debería devolver el mensaje de actualización cuando la acción es UPDATE', async () => {
      const repository = createFakeRepository({
        createOrUpdate: async () => ({ action: 'UPDATE', data: REPOSITORY_RESPONSE }),
      })
      const useCase = new RegisterFavoritoUseCase(repository, createFakeLogger().logger)

      const result = await useCase.execute(FAVORITO_INPUT)

      expect(result).toEqual({ action: 'UPDATE', data: REPOSITORY_RESPONSE, message: 'Favorito updateado correctamente' })
    })
  })

  describe('favorito duplicado', () => {
    it('debería lanzar FavoritoAlreadyExistsException sin persistir cuando ya existe', async () => {
      const criteriaCalls: Criteria[] = []
      let createOrUpdateCalled = false
      const repository = createFakeRepository({
        existsByCriteria: async criteria => {
          criteriaCalls.push(criteria)
          return true
        },
        createOrUpdate: async () => {
          createOrUpdateCalled = true
          return null
        },
      })
      const useCase = new RegisterFavoritoUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(FAVORITO_INPUT)).rejects.toBeInstanceOf(FavoritoAlreadyExistsException)
      expect(criteriaCalls).toEqual([
        { idUser: FAVORITO_INPUT.idUser, objectName: FAVORITO_INPUT.objectName, schema: FAVORITO_INPUT.schema },
      ])
      expect(createOrUpdateCalled).toBe(false)
    })
  })

  describe('fallo de persistencia', () => {
    it('debería lanzar Error cuando el repositorio no devuelve resultado', async () => {
      const repository = createFakeRepository({ createOrUpdate: async () => null })
      const useCase = new RegisterFavoritoUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(FAVORITO_INPUT)).rejects.toThrow('Error al insertar o updatear un favorito')
    })
  })
})
