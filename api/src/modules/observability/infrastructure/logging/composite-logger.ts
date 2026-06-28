import { Context, Logger, Message } from '@observability/domain/logger'

export class CompositeLogger implements Logger {
  constructor(private readonly loggers: Logger[]) {}

  debug(message: Message, context?: Context): void {
    this.call('debug', message, context)
  }

  info(message: Message, context?: Context): void {
    this.call('info', message, context)
  }

  warn(message: Message, context?: Context): void {
    this.call('warn', message, context)
  }

  error(message: Message, context?: Context): void {
    this.call('error', message, context)
  }

  fatal(message: Message, context?: Context): void {
    this.call('fatal', message, context)
  }

  private call(level: keyof Logger, message: Message, context?: Context): void {
    for (const logger of this.loggers) {
      try {
        logger[level](message, context)
      } catch (err) {
        // Observability must never break application flow.
        console.error('[observability] Error al emitir log', err)
      }
    }
  }
}
