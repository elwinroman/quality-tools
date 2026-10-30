import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import type { MSSQLConnection } from '@core/store/mssql-connection'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import { MSSQLQueryRunner } from '@core/store/mssql-query-runner'
import { MssqlSysObjectRepositoryAdapter } from '@sysobject/infrastructure/adapters/drivens/mssql-sysobject-repository.adapter'
import sql, { ConnectionPool } from 'mssql'
import { describe, expect, it, vi } from 'vitest'

const credentials = { host: 'host', database: 'database', user: 'user', password: 'password' }
const resolver: CurrentStoreContextResolver = {
  resolve: vi.fn(async () => ({
    authContext: { userId: 1, sessionId: 'session' },
    store: { credentials, type: UserTypeEnum.External },
  })),
}

function buildRequest() {
  const request = { input: vi.fn(), query: vi.fn() }
  request.input.mockReturnValue(request)
  return request
}

/**
 * Cada prueba construye su propio fixture: los mocks de una prueba no deben
 * sobrevivir a la siguiente. En particular, `vi.clearAllMocks()` no vacía la
 * cola de `mockReturnValueOnce`, así que compartir el `pool` entre pruebas
 * dejaba un valor encolado sin consumir que se filtraba al siguiente caso.
 */
function buildConnectionFixture() {
  const primaryRequest = buildRequest()
  const fallbackRequest = buildRequest()
  const pool = { request: vi.fn() }
  const connect = vi.fn(async () => pool as unknown as ConnectionPool)
  const connection: MSSQLConnection = { connect }
  pool.request.mockReturnValueOnce(primaryRequest).mockReturnValueOnce(fallbackRequest)

  return { primaryRequest, fallbackRequest, pool, connect, connection }
}

describe('MssqlSysObjectRepositoryAdapter.findDependenciesBySchemaAndName', () => {
  it('debería crear otra solicitud del mismo pool y mapear el fallback ante el error 2020', async () => {
    const { primaryRequest, fallbackRequest, pool, connect, connection } = buildConnectionFixture()
    const incompleteError = Object.assign(new sql.RequestError('dependencias incompletas', 'EREQUEST'), { number: 2020 })
    primaryRequest.query.mockRejectedValue(incompleteError)
    fallbackRequest.query.mockResolvedValue({
      recordset: [{ object_id: 7, schema_name: 'dbo', object_name: 'Dependencia', type_desc: 'SQL_STORED_PROCEDURE ' }],
    })
    const adapter = new MssqlSysObjectRepositoryAdapter(new MSSQLQueryRunner(connection), resolver)

    const result = await adapter.findDependenciesBySchemaAndName('Origen', 'dbo')

    expect(connect).toHaveBeenCalledTimes(2)
    expect(pool.request).toHaveBeenCalledTimes(2)
    expect(primaryRequest.query.mock.calls[0]?.[0]).toContain('sys.dm_sql_referenced_entities')
    expect(fallbackRequest.query.mock.calls[0]?.[0]).toContain('sys.sql_expression_dependencies')
    expect(result).toEqual({
      data: [{ id: 7, schemaName: 'dbo', name: 'Dependencia', typeDesc: 'SQL_STORED_PROCEDURE' }],
      meta: {
        warning: {
          type: 'DependencyMetadataFallback',
          detail: '[dbo.Origen] dependencias incompletas',
          source: 'sys.dm_sql_referenced_entities',
          fallbackSource: 'sys.sql_expression_dependencies',
        },
      },
    })
  })

  it('debería propagar crudo un error no relacionado sin crear la solicitud de fallback', async () => {
    const { primaryRequest, fallbackRequest, pool, connection } = buildConnectionFixture()
    const unrelatedError = Object.assign(
      new sql.RequestError('The dependencies reported for entity might not include references to all columns', 'EREQUEST'),
      { number: 50000 },
    )
    primaryRequest.query.mockRejectedValue(unrelatedError)
    const adapter = new MssqlSysObjectRepositoryAdapter(new MSSQLQueryRunner(connection), resolver)

    const operation = adapter.findDependenciesBySchemaAndName('Origen', 'dbo')

    await expect(operation).rejects.toBe(unrelatedError)
    await expect(operation).rejects.toBeInstanceOf(sql.RequestError)
    await expect(operation).rejects.toMatchObject({ number: 50000 })
    expect(pool.request).toHaveBeenCalledTimes(1)
    expect(fallbackRequest.query).not.toHaveBeenCalled()
  })
})
