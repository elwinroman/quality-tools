import { InvalidCredentialsException } from '@auth/domain/exceptions'
import sql from 'mssql'

import { DatabaseError, DatabaseErrorMappingException } from '../exceptions'

/**
 * Verifica si un error proviene realmente de MSSQL.
 *
 * Usa `instanceof` contra las clases de node-mssql en lugar de comprobar la
 * presencia de `code`, `message` y `name`: los errores del sistema (fs, net)
 * también exponen `code` (ENOENT, ECONNREFUSED, ...) y eran etiquetados como
 * errores de base de datos por error.
 */
function isMSSQLError(err: unknown): err is sql.RequestError | sql.PreparedStatementError | sql.TransactionError | sql.ConnectionError {
  return (
    err instanceof sql.RequestError ||
    err instanceof sql.PreparedStatementError ||
    err instanceof sql.TransactionError ||
    err instanceof sql.ConnectionError
  )
}

/**
 * Extrae un `code` legible de un valor desconocido para el mensaje de log.
 * No participa en la clasificación; solo describe el error no reconocido.
 */
function describeErrorCode(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'code' in err) return String((err as { code: unknown }).code)
  return err instanceof Error ? err.constructor.name : typeof err
}

/**
 * Envuelve el error original en `DatabaseError` **solo** cuando proviene de MSSQL.
 *
 * La librería `node-mssql` genera errores internos cuyo `stacktrace`
 * apunta a código propio de la librería y no a la línea real donde se
 * ejecuta la consulta.
 *
 * Este wrapper permite:
 * - Preservar el contexto del error original.
 * - Normalizar el tipo de excepción.
 * - Facilitar el rastreo (trace) hasta el punto real de la consulta.
 *
 * Si el error no corresponde a MSSQL, se lanza `DatabaseErrorMappingException`
 * (un error de infraestructura real, no una clase abstracta).
 */
export function wrapDatabaseError(err: unknown): DatabaseError {
  if (err instanceof InvalidCredentialsException) throw err

  if (isMSSQLError(err)) {
    return new DatabaseError(err)
  }

  const message = err instanceof Error ? err.message : String(err)
  const cause = err instanceof Error ? err : undefined

  throw new DatabaseErrorMappingException(describeErrorCode(err), message, cause)
}
