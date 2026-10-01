import { DeleteBusquedaRecienteUseCase } from '@busqueda-reciente/application/use-cases/delete-busqueda-reciente.use-case'
import { BusquedaRecienteNotFoundException } from '@busqueda-reciente/domain/exceptions/busqueda-reciente-not-found.exception'
import { ForBusquedaRecienteRepositoryPort } from '@busqueda-reciente/domain/ports/drivens/for-busqueda-reciente-repository.port'
import { BusquedaReciente, Context } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
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

function createFakeRepository(overrides: Partial<ForBusquedaRecienteRepositoryPort> = {}): ForBusquedaRecienteRepositoryPort {
  return {
    createOrUpdate: async () => false,
    deleteById: async () => false,
    findMany: async () => ({ data: [], meta: { limit: 0, total: 0 } }),
    getById: async () => null,
    ...overrides,
  }
}

const BUSQUEDA_ID = 'hash-busqueda'
const BUSQUEDA_OWNER_ID = 9
const BUSQUEDA_DATABASE = 'QualityTools'

const CONTEXT: Context = { idUser: BUSQUEDA_OWNER_ID, database: BUSQUEDA_DATABASE }

function buildBusqueda(overrides: Partial<BusquedaReciente> = {}): BusquedaReciente {
  return {
    id: BUSQUEDA_ID,
    idUser: BUSQUEDA_OWNER_ID,
    database: BUSQUEDA_DATABASE,
    schema: 'dbo',
    objectName: 'vw_orders',
    type: TypeSysObjectEnum.VIEW,
    dateSearch: new Date('2026-01-01T00:00:00.000Z'),
    isActive: true,
    ...overrides,
  }
}

describe('DeleteBusquedaRecienteUseCase', () => {
  describe('búsqueda reciente no encontrada', () => {
    it('debería lanzar BusquedaRecienteNotFoundException cuando no existe y no eliminarla', async () => {
      let deleteCalled = false
      const repository = createFakeRepository({
        getById: async () => null,
        deleteById: async () => {
          deleteCalled = true
          return true
        },
      })
      const useCase = new DeleteBusquedaRecienteUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(BUSQUEDA_ID, CONTEXT)).rejects.toBeInstanceOf(BusquedaRecienteNotFoundException)
      expect(deleteCalled).toBe(false)
    })

    it('debería lanzar BusquedaRecienteNotFoundException cuando está inactiva', async () => {
      const repository = createFakeRepository({ getById: async () => buildBusqueda({ isActive: false }) })
      const useCase = new DeleteBusquedaRecienteUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(BUSQUEDA_ID, CONTEXT)).rejects.toBeInstanceOf(BusquedaRecienteNotFoundException)
    })

    it('debería lanzar BusquedaRecienteNotFoundException cuando pertenece a otro usuario', async () => {
      const repository = createFakeRepository({ getById: async () => buildBusqueda() })
      const useCase = new DeleteBusquedaRecienteUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(BUSQUEDA_ID, { ...CONTEXT, idUser: BUSQUEDA_OWNER_ID + 1 })).rejects.toBeInstanceOf(
        BusquedaRecienteNotFoundException,
      )
    })

    it('debería lanzar BusquedaRecienteNotFoundException cuando pertenece a otra base de datos', async () => {
      const repository = createFakeRepository({ getById: async () => buildBusqueda() })
      const useCase = new DeleteBusquedaRecienteUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(BUSQUEDA_ID, { ...CONTEXT, database: 'OtraBase' })).rejects.toBeInstanceOf(
        BusquedaRecienteNotFoundException,
      )
    })
  })

  describe('comparación de base de datos sin distinguir mayúsculas', () => {
    it('debería eliminar cuando la base de datos solo difiere en mayúsculas', async () => {
      const deleteCalls: string[] = []
      const repository = createFakeRepository({
        getById: async () => buildBusqueda(),
        deleteById: async id => {
          deleteCalls.push(id)
          return true
        },
      })
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new DeleteBusquedaRecienteUseCase(repository, logger)

      const result = await useCase.execute(BUSQUEDA_ID, { ...CONTEXT, database: BUSQUEDA_DATABASE.toLowerCase() })

      expect(deleteCalls).toEqual([BUSQUEDA_ID])
      expect(result).toBe(`Se ha eliminado correctamente la búsqueda reciente con id '${BUSQUEDA_ID}'.`)
      expect(infoCalls).toEqual([
        {
          message: '[busqueda-reciente] Búsqueda reciente eliminada',
          context: {
            actionDetails: {
              busquedaRecienteId: BUSQUEDA_ID,
              userId: CONTEXT.idUser,
              database: BUSQUEDA_DATABASE.toLowerCase(),
              schema: 'dbo',
              objectName: 'vw_orders',
              type: TypeSysObjectEnum.VIEW,
            },
          },
        },
      ])
    })
  })

  describe('fallo de eliminación', () => {
    it('debería lanzar Error cuando el repositorio no confirma la eliminación', async () => {
      const repository = createFakeRepository({
        getById: async () => buildBusqueda(),
        deleteById: async () => false,
      })
      const useCase = new DeleteBusquedaRecienteUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(BUSQUEDA_ID, CONTEXT)).rejects.toThrow(
        `Ha ocurrido un error inesperado en la eliminación de la búsqueda reciente con id '${BUSQUEDA_ID}'`,
      )
    })
  })
})
