import { InfrastructureError } from '@core/infrastructure-error.exception'

export class DatabaseErrorMappingException extends InfrastructureError {
  readonly type = 'DatabaseErrorMappingException'
  static readonly title = 'Error de base de datos no clasificado'
  readonly detail: string
  static readonly metadata = { status: 500, errorCode: 5005 }

  constructor(code: string, message: string, cause?: Error) {
    super(`[db] Error de base de datos no clasificado: ${code} - ${message}`, cause)
    this.detail = `No se pudo clasificar el error de base de datos. ${code} - ${message}`
  }
}
