import {
  DatabaseConnectionErrorException,
  DatabaseErrorMappingException,
  DatabasePreparedStatementErrorException,
  DatabaseRequestErrorException,
  DatabaseTransactionErrorException,
} from '@core/exceptions'
import { InfrastructureError } from '@core/infrastructure-error.exception'
import sql from 'mssql'

/**
 * Mapea un error de MSSQL a un error de dominio específico.
 *
 * La clasificación usa `instanceof`, de modo que una subclase de cualquiera de
 * los errores conocidos sigue coincidiendo y el mapeo no depende del nombre de
 * la clase (frágil ante renombres o minificación).
 *
 * @param err - Instancia del error de MSSQL (RequestError, PreparedStatementError, TransactionError o ConnectionError).
 * @returns Una instancia de un error de dominio correspondiente.
 */
export function mapMSSQLError(
  err: sql.RequestError | sql.PreparedStatementError | sql.TransactionError | sql.ConnectionError,
): InfrastructureError {
  // Se leen antes de estrechar el tipo: en el fallback TypeScript reduce la
  // unión a `never` y ya no permitiría acceder a `code`/`message`.
  const { code, message } = err

  if (err instanceof sql.ConnectionError) return new DatabaseConnectionErrorException(code, message)
  if (err instanceof sql.RequestError) return new DatabaseRequestErrorException(code, message)
  if (err instanceof sql.PreparedStatementError) return new DatabasePreparedStatementErrorException(code, message)
  if (err instanceof sql.TransactionError) return new DatabaseTransactionErrorException(code, message)

  return new DatabaseErrorMappingException(code, message, err)
}
