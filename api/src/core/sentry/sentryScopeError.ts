import { getRequestLogContext } from '@observability/infrastructure/context/request-log-context.storage'
import * as Sentry from '@sentry/node'

import { SENTRY_REPORTING_ENABLED } from '@/config/enviroment'

import { InfrastructureError } from '../infrastructure-error.exception'

/** Límite de caracteres del statement que se adjunta al evento de Sentry. */
export const SENTRY_STATEMENT_MAX_LENGTH = 2000

/** Marca visible de que el statement fue recortado antes de enviarse. */
export const SENTRY_STATEMENT_TRUNCATION_MARKER = '… [statement truncated]'

/** Clave del contexto de Sentry que describe la operación de base de datos que falló. */
export const SENTRY_DATABASE_OPERATION_CONTEXT = 'Database operation'

/** Delimitador visible entre los frames de la aplicación y el stack original del driver. */
export const SENTRY_ORIGINAL_STACK_MARKER = 'Original MSSQL stack:'

/**
 * Recorta el statement al límite configurado y agrega una marca cuando hubo recorte.
 * Se adjunta como contexto del evento: nunca en el mensaje ni en el stack.
 */
export function truncateStatementForSentry(statement: string): string {
  if (statement.length <= SENTRY_STATEMENT_MAX_LENGTH) return statement

  return `${statement.slice(0, SENTRY_STATEMENT_MAX_LENGTH)}${SENTRY_STATEMENT_TRUNCATION_MARKER}`
}

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

    // El ejecutor de base de datos guardó el contexto de la operación; el formateo se difiere
    // hasta este único punto de reporte. El statement viaja como contexto (truncado) porque es
    // el SQL que falló; las credenciales y los valores de parámetros nunca entran al contexto.
    const databaseOperation = context.databaseOperationCallsite

    if (databaseOperation && err instanceof Error) {
      enrichErrorStackWithCallsite(err, databaseOperation.stack)
    }

    if (databaseOperation) {
      scope.setContext(SENTRY_DATABASE_OPERATION_CONTEXT, {
        operation: databaseOperation.operation,
        statement: truncateStatementForSentry(databaseOperation.statement),
      })
    }

    if (err instanceof InfrastructureError) scope.setExtra('descripcion', err.detail)

    // Se reporta la instancia cruda del error, sin objeto proxy intermedio.
    Sentry.captureException(err)
  })
}

/**
 * Antepone los frames de la aplicación al stack del driver para que Sentry muestre primero
 * el repositorio llamador y luego, tras un delimitador claro, el stack original de MSSQL.
 */
export function enrichErrorStackWithCallsite(err: Error, callsiteStack?: string): void {
  const originalStack = err.stack
  const applicationFrames = callsiteStack ? extractApplicationFrames(callsiteStack) : undefined

  err.stack = [`${err.name}: ${err.message}`, applicationFrames, SENTRY_ORIGINAL_STACK_MARKER, originalStack]
    .filter((stackPart): stackPart is string => Boolean(stackPart))
    .join('\n')
}

/**
 * `Error.captureStackTrace` escribe una línea de encabezado sintética (`Error: `) antes de los
 * frames. Aquí se descarta y se conservan únicamente las líneas de frame reales.
 */
function extractApplicationFrames(callsiteStack: string): string {
  return callsiteStack
    .split('\n')
    .filter(line => line.trim().startsWith('at '))
    .join('\n')
}

function sanitizeRequestBody(body: Record<string, unknown>) {
  const sanitized = { ...body }
  delete sanitized.password
  delete sanitized.token
  return sanitized
}
