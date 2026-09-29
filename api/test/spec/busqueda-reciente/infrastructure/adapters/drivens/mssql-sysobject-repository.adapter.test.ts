import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { MssqlSysObjectRepositoryAdapter } from '@busqueda-reciente/infrastructure/adapters/drivens/mssql-sysobject-repository.adapter'
import { DatabaseErrorMappingException } from '@core/exceptions/store/database-error-mapping.exception'
import { MSSQLConnection } from '@core/store/mssql-connection'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const credentials = { host: 'host', database: 'database', user: 'user', password: 'password' }

const currentStoreContextResolver: CurrentStoreContextResolver = {
  resolve: vi.fn(async () => ({
    authContext: { userId: 1, sessionId: 'session' },
    store: { credentials, type: UserTypeEnum.External },
  })),
}

// Doble del contrato inyectado: el adaptador solo necesita `connect().request().input().query()`
const connectionControl = {
  connect: vi.fn(),
  input: vi.fn(),
  query: vi.fn(),
}

const connection: MSSQLConnection = { connect: connectionControl.connect }

describe('MssqlSysObjectRepositoryAdapter.findIDsByNameAndSchema', () => {
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

    const adapter = new MssqlSysObjectRepositoryAdapter(connection, currentStoreContextResolver)
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

    const adapter = new MssqlSysObjectRepositoryAdapter(connection, currentStoreContextResolver)
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
    const adapter = new MssqlSysObjectRepositoryAdapter(connection, currentStoreContextResolver)

    const result = await adapter.findIDsByNameAndSchema([])

    expect(result).toEqual([])
    expect(connectionControl.connect).not.toHaveBeenCalled()
  })

  it('debería usar la conexión inyectada con las credenciales y el tipo resueltos', async () => {
    const adapter = new MssqlSysObjectRepositoryAdapter(connection, currentStoreContextResolver)

    await adapter.findIDsByNameAndSchema([{ schema: 'dbo', name: 'objeto' }])

    expect(connectionControl.connect).toHaveBeenCalledWith(credentials, UserTypeEnum.External)
  })

  it('debería propagar el fallo de la conexión inyectada envuelto en DatabaseErrorMappingException', async () => {
    connectionControl.connect.mockRejectedValue(new Error('conexión rechazada'))

    const adapter = new MssqlSysObjectRepositoryAdapter(connection, currentStoreContextResolver)

    await expect(adapter.findIDsByNameAndSchema([{ schema: 'dbo', name: 'objeto' }])).rejects.toBeInstanceOf(DatabaseErrorMappingException)
  })
})
