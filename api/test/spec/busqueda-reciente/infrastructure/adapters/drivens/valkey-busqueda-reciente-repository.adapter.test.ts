import { BusquedaRecienteInput } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { ValkeyCacheBusquedaRecienteRepositoryAdapter } from '@busqueda-reciente/infrastructure/adapters/drivens/valkey-busqueda-reciente-repository.adapter'
import { KeyValueStore } from '@core/cache/key-value-store'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it, vi } from 'vitest'

// el adaptador solo consume el TTL configurado; se fija para aislar la prueba del entorno
vi.mock('@/config/enviroment', () => ({ BUSQUEDA_RECIENTE_CACHE_TTL: 86400 }))

const TTL = 86400

interface StoredEntry {
  id: string
  idUser: number
  database: string
  schema: string
  objectName: string
  type: string
  dateSearch: string
  isActive: boolean
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replace(/\\\*/g, '.*')}$`)
}

function createFakeCache() {
  const store = new Map<string, string>()
  const setCalls: Array<{ key: string; ttl?: number }> = []
  const keysCalls: string[] = []

  const cache: KeyValueStore = {
    set: async (key, value, ttl) => {
      setCalls.push({ key, ttl })
      store.set(key, value)
    },
    compareAndSet: async (key, expected, value) => {
      if (store.get(key) !== expected) return false
      store.set(key, value)
      return true
    },
    get: async key => store.get(key) ?? null,
    delete: async key => {
      store.delete(key)
    },
    ttl: async key => (store.has(key) ? -1 : -2),
    keys: async pattern => {
      keysCalls.push(pattern)
      const matcher = globToRegExp(pattern)
      return [...store.keys()].filter(key => matcher.test(key))
    },
  }

  return { cache, store, setCalls, keysCalls }
}

function readEntries(store: Map<string, string>, key: string): StoredEntry[] {
  const raw = store.get(key)
  return raw ? (JSON.parse(raw) as StoredEntry[]) : []
}

function buildInput(overrides: Partial<BusquedaRecienteInput> = {}): BusquedaRecienteInput {
  return {
    idUser: 7,
    database: 'QualityTools',
    schema: 'dbo',
    objectName: 'vw_orders',
    type: TypeSysObjectEnum.VIEW,
    dateSearch: new Date('2026-01-01T00:00:00.000Z'),
    isActive: true,
    ...overrides,
  }
}

describe('ValkeyCacheBusquedaRecienteRepositoryAdapter', () => {
  describe('forma de la clave', () => {
    it('debería usar el prefijo, el usuario y la base en minúsculas separados por dos puntos', async () => {
      const { cache, store, setCalls } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      await expect(adapter.createOrUpdate(buildInput({ idUser: 12, database: 'QualityTools' }))).resolves.toBe(true)

      expect([...store.keys()]).toEqual(['busqueda-reciente:12:qualitytools'])
      expect(setCalls).toEqual([{ key: 'busqueda-reciente:12:qualitytools', ttl: TTL }])
    })
  })

  describe('identidad de la entrada', () => {
    it('debería generar un id determinista e insensible a mayúsculas y deduplicar por ese id', async () => {
      const { cache, store } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      await adapter.createOrUpdate(buildInput({ database: 'QualityTools', schema: 'dbo', objectName: 'vw_orders' }))
      await adapter.createOrUpdate(buildInput({ database: 'qualitytools', schema: 'DBO', objectName: 'VW_ORDERS' }))

      const entries = readEntries(store, 'busqueda-reciente:7:qualitytools')
      expect(entries).toHaveLength(1)
      expect(entries[0].id).toMatch(/^[a-f0-9]{32}$/)

      await adapter.createOrUpdate(buildInput({ objectName: 'vw_customers' }))

      const updated = readEntries(store, 'busqueda-reciente:7:qualitytools')
      expect(updated).toHaveLength(2)
      expect(updated[0].id).not.toBe(updated[1].id)
    })
  })

  describe('ordenamiento', () => {
    it('debería persistir las entradas ordenadas por fecha descendente', async () => {
      const { cache, store } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)
      const old = new Date('2026-01-01T00:00:00.000Z')
      const recent = new Date('2026-03-01T00:00:00.000Z')
      const mid = new Date('2026-02-01T00:00:00.000Z')

      await adapter.createOrUpdate(buildInput({ objectName: 'old', dateSearch: old }))
      await adapter.createOrUpdate(buildInput({ objectName: 'recent', dateSearch: recent }))
      await adapter.createOrUpdate(buildInput({ objectName: 'mid', dateSearch: mid }))

      const entries = readEntries(store, 'busqueda-reciente:7:qualitytools')
      expect(entries.map(e => e.objectName)).toEqual(['recent', 'mid', 'old'])
      expect(entries.map(e => e.dateSearch)).toEqual([recent.toISOString(), mid.toISOString(), old.toISOString()])
    })
  })

  describe('deduplicación', () => {
    it('debería reemplazar la entrada existente cuando el id coincide en lugar de duplicarla', async () => {
      const { cache, store } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      await adapter.createOrUpdate(
        buildInput({ type: TypeSysObjectEnum.VIEW, isActive: true, dateSearch: new Date('2026-01-01T00:00:00.000Z') }),
      )
      await adapter.createOrUpdate(
        buildInput({ type: TypeSysObjectEnum.USER_TABLE, isActive: false, dateSearch: new Date('2026-05-01T00:00:00.000Z') }),
      )

      const entries = readEntries(store, 'busqueda-reciente:7:qualitytools')
      expect(entries).toHaveLength(1)
      expect(entries[0]).toMatchObject({ type: TypeSysObjectEnum.USER_TABLE, isActive: false })
    })
  })

  describe('límite de entradas', () => {
    it('debería conservar solo las 30 más recientes y descartar la más antigua al superar el tope', async () => {
      const { cache, store } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      for (let index = 0; index <= 30; index++) {
        await adapter.createOrUpdate(buildInput({ objectName: `obj_${index}`, dateSearch: new Date(Date.UTC(2026, 0, 1 + index)) }))
      }

      const entries = readEntries(store, 'busqueda-reciente:7:qualitytools')
      expect(entries).toHaveLength(30)
      expect(entries[0].objectName).toBe('obj_30')
      expect(entries[29].objectName).toBe('obj_1')
      expect(entries.some(e => e.objectName === 'obj_0')).toBe(false)
    })
  })

  describe('filtrado por tipo', () => {
    it('debería excluir las inactivas, filtrar por tipo y respetar el límite con el total real', async () => {
      const { cache } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      await adapter.createOrUpdate(
        buildInput({ objectName: 'view_active', type: TypeSysObjectEnum.VIEW, dateSearch: new Date('2026-03-01T00:00:00.000Z') }),
      )
      await adapter.createOrUpdate(
        buildInput({ objectName: 'table_active', type: TypeSysObjectEnum.USER_TABLE, dateSearch: new Date('2026-02-01T00:00:00.000Z') }),
      )
      await adapter.createOrUpdate(
        buildInput({
          objectName: 'view_inactive',
          type: TypeSysObjectEnum.VIEW,
          isActive: false,
          dateSearch: new Date('2026-01-01T00:00:00.000Z'),
        }),
      )

      const onlyViews = await adapter.findMany({ idUser: 7, database: 'QualityTools', type: TypeSysObjectEnum.VIEW }, 10)
      expect(onlyViews.data).toHaveLength(1)
      expect(onlyViews.data[0]).toMatchObject({ objectName: 'view_active', schema: 'dbo' })
      expect(onlyViews.meta).toEqual({ total: 1, limit: 10 })

      const allLimited = await adapter.findMany({ idUser: 7, database: 'QualityTools', type: TypeSysObjectEnum.ALL }, 1)
      expect(allLimited.data).toHaveLength(1)
      expect(allLimited.data[0].objectName).toBe('view_active')
      expect(allLimited.meta).toEqual({ total: 2, limit: 1 })
    })
  })

  describe('eliminación', () => {
    it('debería escanear las claves del prefijo y borrar la entrada de la clave que la contiene', async () => {
      const { cache, store, keysCalls } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      await adapter.createOrUpdate(buildInput({ idUser: 1, objectName: 'other_user' }))
      await adapter.createOrUpdate(buildInput({ idUser: 2, objectName: 'target' }))
      await adapter.createOrUpdate(buildInput({ idUser: 2, objectName: 'sibling' }))

      const targetId = readEntries(store, 'busqueda-reciente:2:qualitytools').find(e => e.objectName === 'target')?.id
      expect(targetId).toBeDefined()

      await expect(adapter.deleteById(targetId ?? '')).resolves.toBe(true)

      expect(keysCalls).toContain('busqueda-reciente:*')
      expect(readEntries(store, 'busqueda-reciente:2:qualitytools').map(e => e.objectName)).toEqual(['sibling'])
      expect(readEntries(store, 'busqueda-reciente:1:qualitytools').map(e => e.objectName)).toEqual(['other_user'])
    })

    it('debería eliminar la clave completa cuando se borra la última entrada', async () => {
      const { cache, store } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      await adapter.createOrUpdate(buildInput())
      const id = readEntries(store, 'busqueda-reciente:7:qualitytools')[0].id

      await expect(adapter.deleteById(id)).resolves.toBe(true)
      expect(store.has('busqueda-reciente:7:qualitytools')).toBe(false)
    })

    it('debería devolver false cuando el id no existe en ninguna clave', async () => {
      const { cache } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      await adapter.createOrUpdate(buildInput())

      await expect(adapter.deleteById('id-inexistente')).resolves.toBe(false)
    })
  })

  describe('valores ausentes', () => {
    it('debería devolver null y colecciones vacías cuando la clave no existe', async () => {
      const { cache } = createFakeCache()
      const adapter = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cache)

      await expect(adapter.getById('id-inexistente', { idUser: 7, database: 'QualityTools' })).resolves.toBeNull()
      await expect(adapter.findMany({ idUser: 7, database: 'QualityTools', type: TypeSysObjectEnum.ALL }, 10)).resolves.toEqual({
        data: [],
        meta: { total: 0, limit: 10 },
      })
      await expect(adapter.deleteById('id-inexistente')).resolves.toBe(false)
    })
  })
})
