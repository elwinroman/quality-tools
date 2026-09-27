import { MSSQLSysObjectRepositoryAdapter } from '@favorito/infrastructure/adapters/drivens/mssql-sysobject-repository.adapter'
import { CacheRepository } from '@shared/domain/cache-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// el adaptador solo conserva el puerto; la resolución real está mockeada en `@core/utils`
const cacheRepository: CacheRepository = {
  set: async () => undefined,
  get: async () => null,
  delete: async () => undefined,
  ttl: async () => -2,
}

const { connectionControl } = vi.hoisted(() => ({
  connectionControl: {
    connect: vi.fn(),
    input: vi.fn(),
    query: vi.fn(),
  },
}))

// se reemplaza el pool real: el adaptador solo necesita `request().input().query()`
vi.mock('@core/store', () => ({
  MSSQLDatabaseConnection: vi.fn(() => ({ connect: connectionControl.connect })),
}))

// se reemplaza el barrel @core/utils para no cargar valkey-client ni @/config/enviroment
vi.mock('@core/utils', () => ({
  buildStoreAuthContext: vi.fn(async () => ({ store: { credentials: {}, type: 'external' } })),
  wrapDatabaseError: vi.fn((err: unknown) => err),
}))

describe('MSSQLSysObjectRepositoryAdapter.findIDsByNameAndSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    connectionControl.connect.mockResolvedValue({
      request: () => ({ input: connectionControl.input, query: connectionControl.query }),
    })
    connectionControl.input.mockReturnValue({ query: connectionControl.query })
    connectionControl.query.mockResolvedValue({ recordset: [] })
  })

  it('debería enviar un nombre con apóstrofe como parámetro JSON en vez de interpolarlo en el SQL', async () => {
    connectionControl.query.mockResolvedValue({ recordset: [{ object_id: 7 }] })

    const adapter = new MSSQLSysObjectRepositoryAdapter(cacheRepository)
    const result = await adapter.findIDsByNameAndSchema([{ schema: "Ven'tas", name: "O'Brien" }])

    expect(result).toEqual([7])

    const [stmt] = connectionControl.query.mock.calls[0]
    // el SQL es fijo: ni el apóstrofe ni los nombres crudos viajan dentro de la sentencia
    expect(stmt).toContain('OPENJSON(@objects)')
    expect(stmt).not.toContain("O'Brien")
    expect(stmt).not.toContain("Ven'tas")

    const [paramName, , rawPayload] = connectionControl.input.mock.calls[0]
    expect(paramName).toBe('objects')
    expect(JSON.parse(rawPayload)).toEqual([{ id: 0, schema: "Ven'tas", name: "O'Brien" }])
  })

  it('debería conservar el orden de entrada en el payload y en el ORDER BY', async () => {
    connectionControl.query.mockResolvedValue({ recordset: [{ object_id: 10 }, { object_id: null }] })

    const adapter = new MSSQLSysObjectRepositoryAdapter(cacheRepository)
    const result = await adapter.findIDsByNameAndSchema([
      { schema: 'dbo', name: 'primera' },
      { schema: 'dbo', name: 'segunda' },
    ])

    // una fila por objeto, en el mismo orden; el NULL del objeto inexistente se conserva
    expect(result).toEqual([10, null])

    const [stmt] = connectionControl.query.mock.calls[0]
    expect(stmt).toContain('ORDER BY id ASC')

    const [, , rawPayload] = connectionControl.input.mock.calls[0]
    expect(JSON.parse(rawPayload)).toEqual([
      { id: 0, schema: 'dbo', name: 'primera' },
      { id: 1, schema: 'dbo', name: 'segunda' },
    ])
  })

  it('debería devolver un arreglo vacío sin abrir conexión cuando no hay objetos', async () => {
    const adapter = new MSSQLSysObjectRepositoryAdapter(cacheRepository)

    const result = await adapter.findIDsByNameAndSchema([])

    expect(result).toEqual([])
    expect(connectionControl.connect).not.toHaveBeenCalled()
  })
})
