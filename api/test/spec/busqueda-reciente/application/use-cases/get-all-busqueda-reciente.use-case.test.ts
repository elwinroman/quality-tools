import { GetAllBusquedasRecientesUseCase } from '@busqueda-reciente/application/use-cases/get-all-busqueda-reciente.use-case'
import { ForBusquedaRecienteRepositoryPort } from '@busqueda-reciente/domain/ports/drivens/for-busqueda-reciente-repository.port'
import { ForSysObjectRepositoryPort, SysObject } from '@busqueda-reciente/domain/ports/drivens/for-sysobject-repository.port'
import { BusquedaRecienteFilter, BusquedaRecienteRepoResponse } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { SysobjectIdsInconsistencyException } from '@core/exceptions/store/sysobject-ids-inconsistency.exception'
import { Logger } from '@observability/domain/logger'
import { Meta } from '@shared/domain/schemas/meta'
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

function createFakeBusquedaRepository(overrides: Partial<ForBusquedaRecienteRepositoryPort> = {}): ForBusquedaRecienteRepositoryPort {
  return {
    createOrUpdate: async () => false,
    deleteById: async () => false,
    findMany: async () => ({ data: [], meta: { limit: 0, total: 0 } }),
    getById: async () => null,
    ...overrides,
  }
}

function createFakeSysObjectRepository(overrides: Partial<ForSysObjectRepositoryPort> = {}): ForSysObjectRepositoryPort {
  return {
    findIDsByNameAndSchema: async () => [],
    ...overrides,
  }
}

const FILTER: BusquedaRecienteFilter = {
  idUser: 7,
  database: 'QualityTools',
  type: TypeSysObjectEnum.VIEW,
}

const LIMIT = 10

function buildRow(overrides: Partial<BusquedaRecienteRepoResponse> = {}): BusquedaRecienteRepoResponse {
  return {
    id: 'hash-busqueda',
    schema: 'dbo',
    objectName: 'vw_orders',
    dateSearch: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }
}

describe('GetAllBusquedasRecientesUseCase', () => {
  describe('sin resultados', () => {
    it('debería devolver un array vacío y no consultar los IDs de objeto', async () => {
      const meta: Meta = { total: 0, limit: LIMIT }
      let sysObjectCalled = false
      const repository = createFakeBusquedaRepository({ findMany: async () => ({ data: [], meta }) })
      const sysObjectRepository = createFakeSysObjectRepository({
        findIDsByNameAndSchema: async () => {
          sysObjectCalled = true
          return []
        },
      })
      const useCase = new GetAllBusquedasRecientesUseCase(repository, sysObjectRepository, createFakeLogger().logger)

      const result = await useCase.execute(FILTER, LIMIT)

      expect(result).toEqual({ data: [], meta })
      expect(sysObjectCalled).toBe(false)
    })
  })

  describe('con resultados', () => {
    it('debería reenviar el filtro, completar cada fila con su objectId y conservar la meta', async () => {
      const rows = [buildRow({ id: 'hash-1' }), buildRow({ id: 'hash-2', objectName: 'fn_total' })]
      const meta: Meta = { total: rows.length, limit: LIMIT }
      const objectIds = [1001, 1002]
      const findManyCalls: Array<{ filter: BusquedaRecienteFilter; limit: number }> = []
      const requestedObjects: SysObject[][] = []
      const repository = createFakeBusquedaRepository({
        findMany: async (filter, limit) => {
          findManyCalls.push({ filter, limit })
          return { data: rows, meta }
        },
      })
      const sysObjectRepository = createFakeSysObjectRepository({
        findIDsByNameAndSchema: async objects => {
          requestedObjects.push(objects)
          return objectIds
        },
      })
      const useCase = new GetAllBusquedasRecientesUseCase(repository, sysObjectRepository, createFakeLogger().logger)

      const result = await useCase.execute(FILTER, LIMIT)

      expect(findManyCalls).toEqual([{ filter: FILTER, limit: LIMIT }])
      expect(requestedObjects).toEqual([rows.map(row => ({ schema: row.schema, name: row.objectName }))])
      expect(result.data).toEqual(rows.map((row, index) => ({ ...row, objectId: objectIds[index] })))
      expect(result.meta).toEqual(meta)
    })
  })

  describe('objeto inexistente en la base', () => {
    it('debería dejar pasar el objectId NULL porque la guarda solo compara longitudes', async () => {
      const rows = [buildRow({ id: 'hash-1' }), buildRow({ id: 'hash-2', objectName: 'fn_total' })]
      const meta: Meta = { total: rows.length, limit: LIMIT }
      const repository = createFakeBusquedaRepository({ findMany: async () => ({ data: rows, meta }) })
      // OBJECT_ID(...) devuelve NULL cuando el objeto ya no existe; el puerto ya lo tipa como number | null.
      const sysObjectRepository = createFakeSysObjectRepository({
        findIDsByNameAndSchema: async () => [1001, null],
      })
      const useCase = new GetAllBusquedasRecientesUseCase(repository, sysObjectRepository, createFakeLogger().logger)

      const result = await useCase.execute(FILTER, LIMIT)

      // el largo coincide (2 === 2), así que el NULL llega al cliente tipado honestamente como number | null.
      expect(result.data.map(row => row.objectId)).toEqual([1001, null])
    })
  })

  describe('inconsistencia de longitudes', () => {
    it('debería lanzar un error cuando la cantidad de IDs no coincide con la de objetos', async () => {
      const rows = [buildRow({ id: 'hash-1' }), buildRow({ id: 'hash-2', objectName: 'fn_total' })]
      const meta: Meta = { total: rows.length, limit: LIMIT }
      const repository = createFakeBusquedaRepository({ findMany: async () => ({ data: rows, meta }) })
      const sysObjectRepository = createFakeSysObjectRepository({
        findIDsByNameAndSchema: async () => [1001],
      })
      const useCase = new GetAllBusquedasRecientesUseCase(repository, sysObjectRepository, createFakeLogger().logger)

      const execution = useCase.execute(FILTER, LIMIT)

      await expect(execution).rejects.toThrowError(SysobjectIdsInconsistencyException)
      await expect(execution).rejects.toThrow('[store] Inconsistencia en la recuperación de IDs: se esperaban 2 IDs y se recibieron 1')
    })
  })
})
