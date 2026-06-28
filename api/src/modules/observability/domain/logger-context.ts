export type LoggerAuthFailureReason = 'missing_token' | 'expired_token' | 'invalid_token' | 'revoked_token' | 'cache_credentials_not_found'

export interface LoggerAuthContext {
  status: 'anonymous' | 'authenticated' | 'failed'
  reason?: LoggerAuthFailureReason
}

export interface LoggerUserContext {
  userId: number
  username: string
  role: string
}

export interface LoggerSessionContext {
  id: string
  jti: string
  type: string
  expirationCountdown: number
}

export interface LoggerSourceContext {
  method: string
  url: string
  userAgent: string
  ip: string
}

export interface LoggerContextUpdate {
  auth?: LoggerAuthContext
  user?: LoggerUserContext
  session?: LoggerSessionContext
}

export abstract class LoggerContext {
  abstract set(context: LoggerContextUpdate): void
}
