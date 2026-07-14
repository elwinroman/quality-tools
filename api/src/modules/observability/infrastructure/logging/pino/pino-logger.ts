import { Context, Logger, Message } from '@observability/domain/logger'
import pino, { TransportTargetOptions } from 'pino'

import { LOG_LEVEL, NODE_ENV } from '@/config/enviroment'
import { MODE } from '@/constants/commons'

import { buildLogContext } from '../log-attributes.mapper'

export interface PinoLoggerDependencies {
  isEnabled?: boolean
}

function buildStdoutTransport(): TransportTargetOptions {
  if (NODE_ENV !== MODE.production) {
    return { target: 'pino-pretty', options: { messageKey: 'message', colorize: true }, level: LOG_LEVEL }
  }
  return { target: 'pino/file', options: { destination: 1 }, level: LOG_LEVEL }
}

/**
 * Logger local de la aplicación.
 * Loki/OTLP se manejan con adaptadores separados para no acoplar Pino al backend de observabilidad.
 */
export class PinoLogger implements Logger {
  private readonly stdoutLogger

  constructor(dependencies: PinoLoggerDependencies = {}) {
    const enabled = dependencies.isEnabled ?? true

    this.stdoutLogger = pino({
      level: 'debug',
      enabled,
      transport: { targets: [buildStdoutTransport()] },
      messageKey: 'message',
    })
  }

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

  private call(level: pino.Level, message: Message, context?: Context) {
    const loggerMessage = {
      message,
      ...buildLogContext(context),
    }

    this.stdoutLogger[level](loggerMessage)
  }
}
