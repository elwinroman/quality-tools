import { DeleteFavoritoUseCase } from '@favorito/application/use-cases/delete-favorito.use-case'
import { FavoritoNotFoundException } from '@favorito/domain/exceptions/favorito-not-found.exception'
import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { Favorito } from '@favorito/domain/schemas/favorito'
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

const FAVORITO_ID = 55
const FAVORITO_OWNER_ID = 9

function buildFavorito(overrides: Partial<Favorito> = {}): Favorito {
  return {
    id: FAVORITO_ID,
    idUser: FAVORITO_OWNER_ID,
    schema: 'dbo',
    objectName: 'vw_orders',
    type: TypeSysObjectEnum.VIEW,
    date: new Date('2026-01-01T00:00:00.000Z'),
    isActive: true,
    ...overrides,
  }
}

describe('DeleteFavoritoUseCase', () => {
  describe('favorito no encontrado', () => {
    it('debería lanzar FavoritoNotFoundException cuando no existe y no eliminarlo', async () => {
      let deleteCalled = false
      const repository = createFakeRepository({
        getById: async () => null,
        deleteById: async () => {
          deleteCalled = true
          return true
        },
      })
      const useCase = new DeleteFavoritoUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(FAVORITO_ID, FAVORITO_OWNER_ID)).rejects.toBeInstanceOf(FavoritoNotFoundException)
      expect(deleteCalled).toBe(false)
    })

    it('debería lanzar FavoritoNotFoundException cuando el favorito está inactivo', async () => {
      const repository = createFakeRepository({ getById: async () => buildFavorito({ isActive: false }) })
      const useCase = new DeleteFavoritoUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(FAVORITO_ID, FAVORITO_OWNER_ID)).rejects.toBeInstanceOf(FavoritoNotFoundException)
    })

    it('debería lanzar FavoritoNotFoundException cuando el favorito pertenece a otro usuario', async () => {
      const repository = createFakeRepository({ getById: async () => buildFavorito() })
      const useCase = new DeleteFavoritoUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(FAVORITO_ID, FAVORITO_OWNER_ID + 1)).rejects.toBeInstanceOf(FavoritoNotFoundException)
    })
  })

  describe('fallo de eliminación', () => {
    it('debería lanzar Error cuando el repositorio no confirma la eliminación', async () => {
      const repository = createFakeRepository({
        getById: async () => buildFavorito(),
        deleteById: async () => false,
      })
      const useCase = new DeleteFavoritoUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(FAVORITO_ID, FAVORITO_OWNER_ID)).rejects.toThrow(
        `Ha ocurrido un error inesperado en la eliminación (update) del favorito con id '${FAVORITO_ID}'`,
      )
    })
  })

  describe('eliminación correcta', () => {
    it('debería eliminar el favorito y devolver el mensaje de confirmación', async () => {
      const deleteCalls: number[] = []
      const repository = createFakeRepository({
        getById: async () => buildFavorito(),
        deleteById: async id => {
          deleteCalls.push(id)
          return true
        },
      })
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new DeleteFavoritoUseCase(repository, logger)

      const result = await useCase.execute(FAVORITO_ID, FAVORITO_OWNER_ID)

      expect(deleteCalls).toEqual([FAVORITO_ID])
      expect(result).toBe(`Se ha eliminado correctamente el favorito con id '${FAVORITO_ID}'.`)
      expect(infoCalls).toHaveLength(1)
    })
  })
})
