import { LoggerContext, LoggerContextUpdate } from '@shared/domain/logger-context'

import { setLoggerRequestContext } from './logger-context'

export class AsyncLocalStorageLoggerContext implements LoggerContext {
  set(context: LoggerContextUpdate): void {
    setLoggerRequestContext(context)
  }
}

export const loggerContext = new AsyncLocalStorageLoggerContext()
