import { AsyncLocalStorage } from 'node:async_hooks'

import { LoggerAuthContext, LoggerContextUpdate, LoggerSourceContext } from '@observability/domain/logger-context'
import { Request } from 'express'

/**
 * Contexto tecnico por request.
 * Es detalle de infraestructura: Express abre el contexto y los loggers lo leen para enriquecer eventos.
 */
export interface LoggerRequestContext extends LoggerContextUpdate {
  correlationId: string
  source: LoggerSourceContext
  auth: LoggerAuthContext
  request: Request
}

export const requestLogContextStorage = new AsyncLocalStorage<LoggerRequestContext>()

export function runWithRequestLogContext(context: LoggerRequestContext, callback: () => void): void {
  requestLogContextStorage.run(context, callback)
}

export function updateRequestLogContext(newContext: Partial<LoggerRequestContext>): void {
  const currentContext = requestLogContextStorage.getStore()

  if (!currentContext) throw new Error('[logger] No hay contexto activo para logger. Usa el middleware inicial para crear uno.')

  const mergedContext = { ...currentContext, ...newContext }
  requestLogContextStorage.enterWith(mergedContext)
}

export function getRequestLogContext(): LoggerRequestContext | undefined {
  return requestLogContextStorage.getStore()
}
