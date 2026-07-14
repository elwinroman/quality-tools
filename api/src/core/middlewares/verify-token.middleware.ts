import { TokenExpiredException } from '@auth/application/exceptions'
import { authenticatorProxyAdapter } from '@auth/infrastructure/adapters/drivers/proxies/composition-root'
import { setAuthContext } from '@auth/infrastructure/auth-context'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { extractBearerToken } from '@core/utils'
import { loggerContext } from '@observability/infrastructure/context/logger-context.adapter'
import { ForbiddenException, UnauthorizedException } from '@shared/application/exceptions'
import { NextFunction, Request, Response } from 'express'

/** Middleware que verifica la validez del token de acceso, que actúa como middleware intermediario. */
export async function verifyTokenMiddleware(req: Request, _res: Response, next: NextFunction) {
  // obtiene el access token desde el Bearer
  const accessToken = extractBearerToken(req.headers.authorization)

  if (!accessToken) {
    loggerContext.set({ auth: { status: 'failed', reason: 'missing_token' } })
    return next(new UnauthorizedException())
  }

  try {
    const decodedToken = await authenticatorProxyAdapter.verifyAccessToken(accessToken)

    // agregar userId en el contexto del logger y el request
    const user = {
      userId: decodedToken.user_id,
      username: decodedToken.username,
      role: decodedToken.role,
    }

    const session = {
      id: decodedToken.session_id,
      jti: decodedToken.jti,
      type: decodedToken.type,
      expirationCountdown: decodedToken.expirationCountdown,
    }

    // A partir de este punto el token es válido y el resto de la request queda trazado como autenticado.
    loggerContext.set({ auth: { status: 'authenticated' }, user, session })
    req.userId = decodedToken.user_id

    // agregar también en el contexto de auth (para la recuperación de las credenciales del usuario desde la cache)
    setAuthContext({ userId: decodedToken.user_id, sessionId: decodedToken.session_id })

    return next()
  } catch (err) {
    // Si hay token pero falla la validación, la traza deja de ser anónima y queda marcada como fallo auth.
    if (err instanceof TokenExpiredException) {
      loggerContext.set({ auth: { status: 'failed', reason: 'expired_token' } })
    } else if (err instanceof ForbiddenException) {
      loggerContext.set({ auth: { status: 'failed', reason: 'revoked_token' } })
    } else if (err instanceof CacheCredentialNotFoundException) {
      loggerContext.set({ auth: { status: 'failed', reason: 'cache_credentials_not_found' } })
    } else {
      loggerContext.set({ auth: { status: 'failed', reason: 'invalid_token' } })
    }

    next(err)
  }
}
