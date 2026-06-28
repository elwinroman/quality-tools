import { LoggerContext, LoggerContextUpdate } from '@observability/domain/logger-context'

import { updateRequestLogContext } from './request-log-context.storage'

/**
 * Adapter del puerto LoggerContext.
 * La aplicacion solo actualiza contexto; no conoce AsyncLocalStorage ni Express.
 */
export class LoggerContextAdapter implements LoggerContext {
  set(context: LoggerContextUpdate): void {
    updateRequestLogContext(context)
  }
}

export const loggerContext = new LoggerContextAdapter()
