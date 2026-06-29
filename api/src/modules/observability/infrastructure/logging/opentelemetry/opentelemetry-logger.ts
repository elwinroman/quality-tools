import { Context, Logger, LoggerLevel, Message } from '@observability/domain/logger'
import { SeverityNumber } from '@opentelemetry/api-logs'
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http'
import { BatchLogRecordProcessor, LoggerProvider } from '@opentelemetry/sdk-logs'

import {
  OTEL_DEPLOYMENT_ENV,
  OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
  OTEL_LOG_EXPORT_INTERVAL,
  OTEL_LOG_EXPORT_TIMEOUT,
  OTEL_RESOURCE_ATTRIBUTES,
  OTEL_SERVICE_NAME,
} from '@/config/enviroment'

import { buildLogContext, flattenLogAttributes } from '../log-attributes.mapper'
import { buildOtelResource } from './otel-resource'
import { WarningLogRecordExporter } from './warning-log-record-exporter'

export class OpenTelemetryLogger implements Logger {
  private readonly provider: LoggerProvider
  private readonly logger

  constructor() {
    const logsEndpointUrl = buildLogsEndpointUrl()

    this.provider = new LoggerProvider({
      resource: buildOtelResource(OTEL_SERVICE_NAME, OTEL_DEPLOYMENT_ENV, OTEL_RESOURCE_ATTRIBUTES),
      processors: [
        new BatchLogRecordProcessor(
          new WarningLogRecordExporter(
            new OTLPLogExporter({
              url: logsEndpointUrl,
            }),
          ),
          {
            scheduledDelayMillis: OTEL_LOG_EXPORT_INTERVAL,
            exportTimeoutMillis: OTEL_LOG_EXPORT_TIMEOUT,
          },
        ),
      ],
    })

    this.logger = this.provider.getLogger(OTEL_SERVICE_NAME)
  }

  debug(message: Message, context?: Context): void {
    this.emit('debug', message, context)
  }

  info(message: Message, context?: Context): void {
    this.emit('info', message, context)
  }

  warn(message: Message, context?: Context): void {
    this.emit('warn', message, context)
  }

  error(message: Message, context?: Context): void {
    this.emit('error', message, context)
  }

  fatal(message: Message, context?: Context): void {
    this.emit('fatal', message, context)
  }

  async shutdown(): Promise<void> {
    await this.provider.shutdown()
  }

  private emit(level: LoggerLevel, message: Message, context?: Context): void {
    const logContext = buildLogContext(context)

    this.logger.emit({
      timestamp: Date.now(),
      severityNumber: severityNumberByLevel[level],
      severityText: level.toUpperCase(),
      body: message,
      attributes: flattenLogAttributes(logContext),
    })
  }
}

const severityNumberByLevel: Record<LoggerLevel, SeverityNumber> = {
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
}

function buildLogsEndpointUrl(): string {
  if (OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) return OTEL_EXPORTER_OTLP_LOGS_ENDPOINT

  const baseEndpoint = OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')
  return `${baseEndpoint}/v1/logs`
}
