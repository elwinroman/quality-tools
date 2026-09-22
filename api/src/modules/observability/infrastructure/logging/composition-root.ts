import { Logger } from '@observability/domain/logger'

import { CONSOLE_LOGS_ENABLED, OTEL_LOGS_ENABLED } from '@/config/enviroment'

import { CompositeLogger } from './composite-logger'
import { OpenTelemetryLogger } from './opentelemetry/opentelemetry-logger'
import { PinoLogger } from './pino/pino-logger'

export interface LoggerComposition {
  logger: Logger
  shutdown(): Promise<void>
}

/**
 * Composition root del logging.
 * Aqui se decide que adapters concretos participan: consola, OTLP, u otros en el futuro.
 */
export function createLoggerComposition(): LoggerComposition {
  const loggers: Logger[] = []
  let otelLogger: OpenTelemetryLogger | null = null

  if (CONSOLE_LOGS_ENABLED) {
    loggers.push(new PinoLogger())
  }

  if (OTEL_LOGS_ENABLED) {
    otelLogger = new OpenTelemetryLogger()
    loggers.push(otelLogger)
  }

  return {
    logger: new CompositeLogger(loggers),
    async shutdown(): Promise<void> {
      await otelLogger?.shutdown()
    },
  }
}
