import { SysobjectIdsInconsistencyException } from '@core/exceptions/store/sysobject-ids-inconsistency.exception'
import { GetAllFavoritosUseCase } from '@favorito/application/use-cases/get-all-favorito.use-case'
import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { ForSysObjectRepositoryPort, SysObject } from '@favorito/domain/ports/drivens/for-sysobject-repository.port'
import { FavoritoFilter, FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
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

function createFakeRepository(overrides: Partial<ForFavoritoRepositoryPort> = {}): ForFavoritoRepositoryPort {
  return {
    createOrUpdate: async () => null,
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

const FILTER: FavoritoFilter = {
  idUser: 7,
  type: TypeSysObjectEnum.VIEW,
}

const LIMIT = 10

function buildRow(overrides: Partial<FavoritoRepoResponse> = {}): FavoritoRepoResponse {
  return {
    id: 1,
    schema: 'dbo',
    objectName: 'vw_orders',
    type: TypeSysObjectEnum.VIEW,
    date: new Date('2026-01-01T00:00:00.000Z'),
    isActive: false,
    ...overrides,
  }
}

describe('GetAllFavoritosUseCase', () => {
  describe('sin resultados', () => {
    it('debería devolver un array vacío y no consultar los IDs de objeto', async () => {
      const meta: Meta = { total: 0, limit: LIMIT }
      let sysObjectCalled = false
      const repository = createFakeRepository({ findMany: async () => ({ data: [], meta }) })
      const sysObjectRepository = createFakeSysObjectRepository({
        findIDsByNameAndSchema: async () => {
          sysObjectCalled = true
          return []
        },
      })
      const useCase = new GetAllFavoritosUseCase(repository, sysObjectRepository, createFakeLogger().logger)

      const result = await useCase.execute(FILTER, LIMIT)

      expect(result).toEqual({ data: [], meta })
      expect(sysObjectCalled).toBe(false)
    })
  })

  describe('con resultados', () => {
    it('debería reenviar el filtro formateado, completar cada fila con su objectId y conservar la meta', async () => {
      const rows = [buildRow({ id: 10 }), buildRow({ id: 20, objectName: 'fn_total' })]
      const meta: Meta = { total: rows.length, limit: LIMIT }
      const objectIds = [1001, 1002]
      const requestedObjects: SysObject[][] = []
      const findManyCalls: Array<{ filter: unknown; limit: number }> = []
      const repository = createFakeRepository({
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
      const useCase = new GetAllFavoritosUseCase(repository, sysObjectRepository, createFakeLogger().logger)

      const result = await useCase.execute(FILTER, LIMIT)

      expect(findManyCalls).toEqual([{ filter: { ...FILTER, type: `'${TypeSysObjectEnum.VIEW}'` }, limit: LIMIT }])
      expect(requestedObjects).toEqual([rows.map(row => ({ schema: row.schema, name: row.objectName }))])
      expect(result.data).toEqual(rows.map((row, index) => ({ ...row, objectId: objectIds[index] })))
      expect(result.meta).toEqual(meta)
    })
  })

  describe('objeto inexistente en la base', () => {
    it('debería dejar pasar el objectId NULL porque la guarda solo compara longitudes', async () => {
      const rows = [buildRow({ id: 10 }), buildRow({ id: 20, objectName: 'fn_total' })]
      const meta: Meta = { total: rows.length, limit: LIMIT }
      const repository = createFakeRepository({ findMany: async () => ({ data: rows, meta }) })
      // OBJECT_ID(...) devuelve NULL cuando el objeto ya no existe; el puerto ya lo tipa como number | null.
      const sysObjectRepository = createFakeSysObjectRepository({
        findIDsByNameAndSchema: async () => [1001, null],
      })
      const useCase = new GetAllFavoritosUseCase(repository, sysObjectRepository, createFakeLogger().logger)

      const result = await useCase.execute(FILTER, LIMIT)

      // el largo coincide (2 === 2), así que el NULL llega al cliente tipado honestamente como number | null.
      expect(result.data.map(row => row.objectId)).toEqual([1001, null])
    })
  })

  describe('inconsistencia de longitudes', () => {
    it('debería lanzar un error cuando la cantidad de IDs no coincide con la de objetos', async () => {
      const rows = [buildRow({ id: 10 }), buildRow({ id: 20, objectName: 'fn_total' })]
      const meta: Meta = { total: rows.length, limit: LIMIT }
      const repository = createFakeRepository({ findMany: async () => ({ data: rows, meta }) })
      const sysObjectRepository = createFakeSysObjectRepository({
        findIDsByNameAndSchema: async () => [1001],
      })
      const useCase = new GetAllFavoritosUseCase(repository, sysObjectRepository, createFakeLogger().logger)

      const execution = useCase.execute(FILTER, LIMIT)

      await expect(execution).rejects.toThrowError(SysobjectIdsInconsistencyException)
      await expect(execution).rejects.toThrow('[store] Inconsistencia en la recuperación de IDs: se esperaban 2 IDs y se recibieron 1')
    })
  })
})
