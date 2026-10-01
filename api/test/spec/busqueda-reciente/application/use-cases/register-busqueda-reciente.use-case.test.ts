import { RegisterBusquedaRecienteUseCase } from '@busqueda-reciente/application/use-cases/register-busqueda-reciente.use-case'
import { ForBusquedaRecienteRepositoryPort } from '@busqueda-reciente/domain/ports/drivens/for-busqueda-reciente-repository.port'
import { BusquedaRecienteInput } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
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

const BUSQUEDA_INPUT: BusquedaRecienteInput = {
  idUser: 7,
  database: 'QualityTools',
  schema: 'dbo',
  objectName: 'vw_orders',
  type: TypeSysObjectEnum.VIEW,
  dateSearch: new Date('2026-01-01T00:00:00.000Z'),
  isActive: true,
}

describe('RegisterBusquedaRecienteUseCase', () => {
  describe('registro correcto', () => {
    it('debería delegar el input al repositorio y registrar el evento', async () => {
      const received: BusquedaRecienteInput[] = []
      const repository = createFakeRepository({
        createOrUpdate: async input => {
          received.push(input)
          return true
        },
      })
      const { logger, infoCalls } = createFakeLogger()
      const useCase = new RegisterBusquedaRecienteUseCase(repository, logger)

      await expect(useCase.execute(BUSQUEDA_INPUT)).resolves.toBeUndefined()

      expect(received).toEqual([BUSQUEDA_INPUT])
      // El arreglo sólo captura nivel `info`: fija a la vez el nivel, el mensaje y el payload del evento.
      expect(infoCalls).toEqual([
        {
          message: '[busqueda-reciente] Búsqueda reciente registrada',
          context: {
            actionDetails: {
              userId: BUSQUEDA_INPUT.idUser,
              database: BUSQUEDA_INPUT.database,
              schema: BUSQUEDA_INPUT.schema,
              objectName: BUSQUEDA_INPUT.objectName,
              type: BUSQUEDA_INPUT.type,
            },
          },
        },
      ])
    })
  })

  describe('fallo de persistencia', () => {
    it('debería lanzar Error cuando el repositorio devuelve false', async () => {
      const repository = createFakeRepository({ createOrUpdate: async () => false })
      const useCase = new RegisterBusquedaRecienteUseCase(repository, createFakeLogger().logger)

      await expect(useCase.execute(BUSQUEDA_INPUT)).rejects.toThrow('Error al insertar o updatear una búsqueda reciente')
    })
  })
})
