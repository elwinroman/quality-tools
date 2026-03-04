import { Context, Logger, LoggerLevel, Message } from '@shared/domain/logger'
import pino, { TransportTargetOptions } from 'pino'

import { LOKI_HOST, LOKI_LOG_LEVEL, LOKI_PASSWORD, LOKI_REPORTING_ENABLED, LOKI_USERNAME, NODE_ENV } from '@/config/enviroment'
import { MODE } from '@/constants/commons'

import { getLoggerRequestContext, LoggerRequestContext } from './logger-context'

export interface PinoLoggerDependencies {
  isEnabled?: boolean
  level?: LoggerLevel
}

function buildTransports(): TransportTargetOptions[] {
  const targets: TransportTargetOptions[] = []

  if (NODE_ENV !== MODE.production) {
    targets.push({
      target: 'pino-pretty',
      options: { messageKey: 'message', colorize: true },
      level: 'debug',
    })
  } else {
    targets.push({
      target: 'pino/file',
      options: { destination: 1 },
      level: 'info',
    })
  }

  if (LOKI_REPORTING_ENABLED && LOKI_HOST) {
    targets.push({
      target: 'pino-loki',
      options: {
        host: LOKI_HOST,
        batching: true,
        interval: 5,
        labels: { app: 'qt-api' },
        basicAuth: LOKI_USERNAME && LOKI_PASSWORD ? { username: LOKI_USERNAME, password: LOKI_PASSWORD } : undefined,
      },
      level: LOKI_LOG_LEVEL ?? 'info',
    })
  }

  return targets
}

export class PinoLogger implements Logger {
  private readonly logger

  constructor(dependencies: PinoLoggerDependencies) {
    this.logger = pino({
      level: 'debug',
      enabled: dependencies.isEnabled ?? true,
      transport: { targets: buildTransports() },
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
    const loggerContext = getLoggerRequestContext() as LoggerRequestContext | undefined

    const { request: _request, ...logContext } = loggerContext ?? {}

    const loggerMessage = {
      message,
      ...(logContext || {}), // agrega atributos del store (de request)
      ...(context || {}), // agregar atributos del contexto manual (por parámetro)
    }
    this.logger[level](loggerMessage)
  }
}
