import { DatabaseConnectionErrorException } from '@core/exceptions/store/database-connection-error.exception'
import { DatabaseErrorMappingException } from '@core/exceptions/store/database-error-mapping.exception'
import { DatabasePreparedStatementErrorException } from '@core/exceptions/store/database-prepared-statement-error.exception'
import { DatabaseRequestErrorException } from '@core/exceptions/store/database-request-error.exception'
import { DatabaseTransactionErrorException } from '@core/exceptions/store/database-transaction-error.exception'
import { mapMSSQLError } from '@core/store/map-mssql-error'
import sql from 'mssql'
import { describe, expect, it } from 'vitest'

/**
 * `mapMSSQLError` classifies a node-mssql error into an infrastructure
 * exception. Dispatch must be inheritance-aware, and an unmapped error must
 * still produce a usable infrastructure exception.
 */
describe('mapMSSQLError', () => {
  it('mapea sql.ConnectionError a DatabaseConnectionErrorException', () => {
    const mapped = mapMSSQLError(new sql.ConnectionError('conexion cerrada', 'ECONNCLOSED'))

    expect(mapped).toBeInstanceOf(DatabaseConnectionErrorException)
    expect(mapped.errorCode).toBe(5000)
  })

  it('mapea sql.RequestError a DatabaseRequestErrorException', () => {
    const mapped = mapMSSQLError(new sql.RequestError('request invalido', 'EREQUEST'))

    expect(mapped).toBeInstanceOf(DatabaseRequestErrorException)
    expect(mapped.errorCode).toBe(5002)
  })

  it('mapea sql.PreparedStatementError a DatabasePreparedStatementErrorException', () => {
    const mapped = mapMSSQLError(new sql.PreparedStatementError('sentencia invalida', 'EPREPARE'))

    expect(mapped).toBeInstanceOf(DatabasePreparedStatementErrorException)
    expect(mapped.errorCode).toBe(5003)
  })

  it('mapea sql.TransactionError a DatabaseTransactionErrorException', () => {
    const mapped = mapMSSQLError(new sql.TransactionError('transaccion invalida', 'ETRAN'))

    expect(mapped).toBeInstanceOf(DatabaseTransactionErrorException)
    expect(mapped.errorCode).toBe(5004)
  })

  it('clasifica un error de MSSQL no mapeado en DatabaseErrorMappingException', () => {
    const unmapped = new sql.MSSQLError('error mssql desconocido', 'EMSSQL') as unknown as sql.RequestError

    const mapped = mapMSSQLError(unmapped)

    expect(mapped).toBeInstanceOf(DatabaseErrorMappingException)
    expect(mapped.type).toBe('DatabaseErrorMappingException')
  })

  it('expone un detail definido para el error de MSSQL no mapeado', () => {
    const unmapped = new sql.MSSQLError('error mssql desconocido', 'EMSSQL') as unknown as sql.RequestError

    const mapped = mapMSSQLError(unmapped)

    expect(mapped.detail).toEqual(expect.any(String))
  })

  it('resuelve el status y el errorCode sin lanzar para el error de MSSQL no mapeado', () => {
    const unmapped = new sql.MSSQLError('error mssql desconocido', 'EMSSQL') as unknown as sql.RequestError

    const mapped = mapMSSQLError(unmapped)

    expect(() => mapped.status).not.toThrow()
    expect(mapped.errorCode).toBe(5005)
  })
})
