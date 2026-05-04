import { ApplicationError } from '@shared/application/application-error'

/**
 * logLevel: 'debug' → no se envía a Grafana/Loki (nivel mínimo de Loki: info).
 * Un token expirado es flujo normal (access ~15min, refresh ~7d), no una advertencia.
 *
 * TODO: para detectar uso malicioso de tokens (clonación, robo), implementar
 * una estrategia de seguridad aparte (ej: reutilización de jti, detección de IP/User-Agent anómalo,
 * o detección de tokens expirados hace demasiado tiempo). Eso NO debe resolverse con logLevel.
 */
export class TokenExpiredException extends ApplicationError {
  readonly type = 'TokenExpiredException'
  static readonly title = 'Autenticación expirada'
  readonly detail: string
  static readonly metadata = { status: 401, errorCode: 2003, logLevel: 'debug' as const }

  constructor(tokenType: string) {
    super(`[auth] Token expirado: ${tokenType}`)
    this.detail = `El ${tokenType} ha expirado.`
  }
}
