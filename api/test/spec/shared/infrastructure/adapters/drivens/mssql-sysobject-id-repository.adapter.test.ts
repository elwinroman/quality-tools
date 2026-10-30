import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { MSSQLConnection } from '@core/store/mssql-connection'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { MSSQLQueryRunner } from '@core/store/mssql-query-runner'
import { MssqlSysObjectIdRepositoryAdapter } from '@shared/infrastructure/adapters/drivens/mssql-sysobject-id-repository.adapter'
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
const queryRunner = new MSSQLQueryRunner(connection)

describe('MssqlSysObjectIdRepositoryAdapter.findIDsByNameAndSchema', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    connectionControl.connect.mockResolvedValue({
      request: () => ({ input: connectionControl.input, query: connectionControl.query }),
    })
    connectionControl.input.mockReturnValue({ input: connectionControl.input, query: connectionControl.query })
    connectionControl.query.mockResolvedValue({ recordset: [] })
  })

  it('debería enviar un nombre con apóstrofe como parámetro enlazado en vez de interpolarlo en el SQL', async () => {
    connectionControl.query.mockResolvedValue({ recordset: [{ object_id: 7 }] })

    const adapter = new MssqlSysObjectIdRepositoryAdapter(queryRunner, currentStoreContextResolver)
    const result = await adapter.findIDsByNameAndSchema([{ schema: "Ven'tas", name: "O'Brien" }])

    expect(result).toEqual([7])

    const [stmt] = connectionControl.query.mock.calls[0]
    // el SQL es fijo: ni el apóstrofe ni los nombres crudos viajan dentro de la sentencia
    expect(stmt).toContain('FROM (VALUES')
    expect(stmt).not.toContain("O'Brien")
    expect(stmt).not.toContain("Ven'tas")

    const inputs = connectionControl.input.mock.calls
    expect(inputs[0][0]).toBe('schema0')
    expect(inputs[0][2]).toBe("Ven'tas")
    expect(inputs[1][0]).toBe('name0')
    expect(inputs[1][2]).toBe("O'Brien")
  })

  it('debería conservar el orden de entrada en los parámetros y en el ORDER BY', async () => {
    connectionControl.query.mockResolvedValue({ recordset: [{ object_id: 10 }, { object_id: null }] })

    const adapter = new MssqlSysObjectIdRepositoryAdapter(queryRunner, currentStoreContextResolver)
    const result = await adapter.findIDsByNameAndSchema([
      { schema: 'dbo', name: 'primera' },
      { schema: 'dbo', name: 'segunda' },
    ])

    // una fila por objeto, en el mismo orden; el NULL del objeto inexistente se conserva
    expect(result).toEqual([10, null])

    const [stmt] = connectionControl.query.mock.calls[0]
    expect(stmt).toContain('ORDER BY v.ordinal ASC')

    const inputs = connectionControl.input.mock.calls.map(call => [call[0], call[2]])
    expect(inputs).toEqual([
      ['schema0', 'dbo'],
      ['name0', 'primera'],
      ['schema1', 'dbo'],
      ['name1', 'segunda'],
    ])
  })

  it('debería devolver un arreglo vacío sin abrir conexión cuando no hay objetos', async () => {
    const adapter = new MssqlSysObjectIdRepositoryAdapter(queryRunner, currentStoreContextResolver)

    const result = await adapter.findIDsByNameAndSchema([])

    expect(result).toEqual([])
    expect(connectionControl.connect).not.toHaveBeenCalled()
  })

  it('debería usar la conexión inyectada con las credenciales y el tipo resueltos', async () => {
    const adapter = new MssqlSysObjectIdRepositoryAdapter(queryRunner, currentStoreContextResolver)

    await adapter.findIDsByNameAndSchema([{ schema: 'dbo', name: 'objeto' }])

    expect(connectionControl.connect).toHaveBeenCalledWith(credentials, UserTypeEnum.External)
  })

  it('debería propagar crudo el fallo de la conexión inyectada', async () => {
    const failure = new Error('conexión rechazada')
    connectionControl.connect.mockRejectedValue(failure)

    const adapter = new MssqlSysObjectIdRepositoryAdapter(queryRunner, currentStoreContextResolver)

    await expect(adapter.findIDsByNameAndSchema([{ schema: 'dbo', name: 'objeto' }])).rejects.toBe(failure)
  })
})
