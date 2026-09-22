import { InvalidCredentialsException } from '@auth/domain/exceptions/invalid-credentials.exception'
import { DatabaseError } from '@core/exceptions/store/database-error.exception'
import { DatabaseErrorMappingException } from '@core/exceptions/store/database-error-mapping.exception'
import { wrapDatabaseError } from '@core/utils/wrap-database-error.util'
import sql from 'mssql'
import { describe, expect, it } from 'vitest'

/**
 * `wrapDatabaseError` must only wrap errors produced by node-mssql.
 *
 * Node system errors (fs, net, ...) also expose `code`, so a loose property
 * check would mislabel them as database errors.
 */
describe('wrapDatabaseError', () => {
  it('envuelve un sql.RequestError en DatabaseError', () => {
    const original = new sql.RequestError('fallo de request', 'EREQUEST')

    const wrapped = wrapDatabaseError(original)

    expect(wrapped).toBeInstanceOf(DatabaseError)
    expect(wrapped.originalError).toBe(original)
  })

  it('envuelve un sql.PreparedStatementError en DatabaseError', () => {
    const original = new sql.PreparedStatementError('fallo de prepared statement', 'EPREPARE')

    const wrapped = wrapDatabaseError(original)

    expect(wrapped).toBeInstanceOf(DatabaseError)
    expect(wrapped.originalError).toBe(original)
  })

  it('envuelve un sql.TransactionError en DatabaseError', () => {
    const original = new sql.TransactionError('fallo de transaccion', 'ETRAN')

    const wrapped = wrapDatabaseError(original)

    expect(wrapped).toBeInstanceOf(DatabaseError)
    expect(wrapped.originalError).toBe(original)
  })

  it('envuelve un sql.ConnectionError en DatabaseError', () => {
    const original = new sql.ConnectionError('fallo de conexion', 'ECONNCLOSED')

    const wrapped = wrapDatabaseError(original)

    expect(wrapped).toBeInstanceOf(DatabaseError)
    expect(wrapped.originalError).toBe(original)
  })

  it('rechaza un error que no proviene de MSSQL aunque tenga code', () => {
    const systemError = Object.assign(new Error('no such file or directory'), { code: 'ENOENT' })

    expect(() => wrapDatabaseError(systemError)).toThrow(DatabaseErrorMappingException)
    expect(() => wrapDatabaseError(systemError)).not.toThrow(DatabaseError)
  })

  it('propaga InvalidCredentialsException sin envolverla', () => {
    const credentialsError = new InvalidCredentialsException('El usuario no existe.')

    expect(() => wrapDatabaseError(credentialsError)).toThrow(credentialsError)
  })
})
