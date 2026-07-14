import { getRequestLogContext } from '@observability/infrastructure/context/request-log-context.storage'
import * as Sentry from '@sentry/node'

import { SENTRY_REPORTING_ENABLED } from '@/config/enviroment'

import { DatabaseError } from '../exceptions'
import { InfrastructureError } from '../infrastructure-error.exception'

export function sentryScopeError(err: unknown) {
  if (!SENTRY_REPORTING_ENABLED) return

  Sentry.withScope(scope => {
    const context = getRequestLogContext()

    if (!context) throw new Error('No hay contexto activo para logger. Usa el middleware inicial para crear uno.')

    // Datos del request manuales (sin sensibles)
    const requestData = {
      method: context.source.method,
      url: context.source.url,
      query: context.request?.query,
      headers: {
        'user-agent': context?.request?.headers['user-agent'] ?? 'N/A',
        host: context.request?.headers['host'] ?? 'N/A',
      },
      data: context.request?.body ? sanitizeRequestBody(context.request.body) : undefined,
    }

    scope.addEventProcessor(event => {
      event.request = requestData
      return event
    })

    // Establece correlationId como tag y como trace id
    const correlationId = context?.correlationId || 'N/A'

    scope.setTag('correlation_id', correlationId)
    scope.setTransactionName(context.source.url)

    // Contexto del usuario
    scope.setUser({
      id: context.user?.userId?.toString(),
      username: context.user?.username,
    })

    // Contexto con más detalle
    scope.setContext('Detalle Usuario', {
      authStatus: context.auth.status,
      authReason: context.auth.reason,
      id: context.user?.userId,
      username: context.user?.username,
      rol: context.user?.role,
      sessionId: context.session?.id,
      jti: context.session?.jti,
    })

    if (err instanceof DatabaseError) {
      const proxyError = new Error(err.message)
      proxyError.name = err.originalError.name // cambia el nombre del error por el original
      proxyError.stack = err.stack

      // contexto del error original
      scope.setContext('Original Error', { ...err.originalError })

      return Sentry.captureException(proxyError)
    }
    if (err instanceof InfrastructureError) scope.setExtra('descripcion', err.detail)

    Sentry.captureException(err)
  })
}

function sanitizeRequestBody(body: Record<string, unknown>) {
  const sanitized = { ...body }
  delete sanitized.password
  delete sanitized.token
  return sanitized
}
