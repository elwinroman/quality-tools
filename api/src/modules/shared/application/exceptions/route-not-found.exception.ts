import { ApplicationError } from '../application-error'

export class RouteNotFoundException extends ApplicationError {
  readonly type = 'RouteNotFoundException'
  static readonly title = 'Ruta no encontrada'
  readonly detail: string
  static readonly metadata = { status: 404, errorCode: 1001 }

  constructor(path?: string) {
    super(`[route] Ruta no encontrada${path ? `: ${path}` : ''}`)
    this.detail =
      'La dirección solicitada no existe o no está disponible en este momento. Verifica que la URL sea correcta e inténtalo nuevamente.'
  }
}
