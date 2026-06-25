import { Context, Logger, LoggerLevel, Message } from '@shared/domain/logger'
import pino, { TransportTargetOptions } from 'pino'

import {
  LOKI_HOST,
  LOKI_INFO_SAMPLE_RATE,
  LOKI_LOG_LEVEL,
  LOKI_PASSWORD,
  LOKI_REPORTING_ENABLED,
  LOKI_USERNAME,
  NODE_ENV,
} from '@/config/enviroment'
import { MODE } from '@/constants/commons'

import { getLoggerRequestContext, LoggerRequestContext } from './logger-context'

export interface PinoLoggerDependencies {
  isEnabled?: boolean
  level?: LoggerLevel
}

function buildStdoutTransport(): TransportTargetOptions {
  if (NODE_ENV !== MODE.production) {
    return { target: 'pino-pretty', options: { messageKey: 'message', colorize: true }, level: 'debug' }
  }
  return { target: 'pino/file', options: { destination: 1 }, level: 'info' }
}

function buildLokiTransport(): TransportTargetOptions | null {
  if (!LOKI_REPORTING_ENABLED || !LOKI_HOST) return null

  return {
    target: 'pino-loki',
    options: {
      host: LOKI_HOST,
      batching: true,
      interval: 5,
      labels: { app: 'qt-api' },
      basicAuth: LOKI_USERNAME && LOKI_PASSWORD ? { username: LOKI_USERNAME, password: LOKI_PASSWORD } : undefined,
    },
    level: LOKI_LOG_LEVEL ?? 'info',
  }
}

/**
 * Logger con dos destinos independientes:
 * - stdout: recibe el 100% de los logs (desarrollo: pino-pretty, producción: JSON)
 * - Loki: recibe warn/error/fatal al 100%, e info con sampling configurable via LOKI_INFO_SAMPLE_RATE
 *         Ej: LOKI_INFO_SAMPLE_RATE=0.15 → solo el 15% de los info se envían a Loki
 */
export class PinoLogger implements Logger {
  private readonly stdoutLogger
  private readonly lokiLogger: pino.Logger | null

  constructor(dependencies: PinoLoggerDependencies) {
    const enabled = dependencies.isEnabled ?? true

    this.stdoutLogger = pino({
      level: 'debug',
      enabled,
      transport: { targets: [buildStdoutTransport()] },
      messageKey: 'message',
    })

    const lokiTransport = buildLokiTransport()
    this.lokiLogger = lokiTransport
      ? pino({
          level: 'debug',
          enabled,
          transport: { targets: [lokiTransport] },
          messageKey: 'message',
        })
      : null
  }

  debug(message: Message, context?: Context): void {
    this.call('debug', message, context)
  }

  /** Aplica sampling solo en Loki. Ej: LOKI_INFO_SAMPLE_RATE=0.15 → 15% de info va a Loki, 100% a stdout */
  info(message: Message, context?: Context): void {
    this.call('info', message, context, LOKI_INFO_SAMPLE_RATE)
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

  /** @param lokiSampleRate - Probabilidad (0 a 1) de enviar el log a Loki. undefined = siempre enviar (100%) */
  private call(level: pino.Level, message: Message, context?: Context, lokiSampleRate?: number) {
    const loggerContext = getLoggerRequestContext() as LoggerRequestContext | undefined

    const { request: _request, ...logContext } = loggerContext ?? {}

    const loggerMessage = {
      message,
      ...(logContext || {}),
      ...(context || {}),
    }

    // stdout siempre recibe todo
    this.stdoutLogger[level](loggerMessage)

    // loki respeta el sample rate (si aplica)
    if (this.lokiLogger) {
      const shouldSample = lokiSampleRate === undefined || Math.random() <= lokiSampleRate
      if (shouldSample) this.lokiLogger[level](loggerMessage)
    }
  }
}
