import { LogRecordExporter, ReadableLogRecord } from '@opentelemetry/sdk-logs'

const EXPORT_SUCCESS_CODE = 0
const EXPORT_FAILED_CODE = 1
const WARNING_INTERVAL_MS = 60_000

export class WarningLogRecordExporter implements LogRecordExporter {
  private lastWarningAt = 0

  constructor(private readonly exporter: LogRecordExporter) {}

  export(logs: ReadableLogRecord[], resultCallback: Parameters<LogRecordExporter['export']>[1]): void {
    try {
      this.exporter.export(logs, result => {
        if (result.code !== EXPORT_SUCCESS_CODE) {
          this.warn(result.error)
        }

        resultCallback(result)
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      this.warn(error)
      resultCallback({ code: EXPORT_FAILED_CODE, error })
    }
  }

  forceFlush(): Promise<void> {
    return this.exporter.forceFlush()
  }

  shutdown(): Promise<void> {
    return this.exporter.shutdown()
  }

  private warn(error?: Error): void {
    const now = Date.now()
    if (now - this.lastWarningAt < WARNING_INTERVAL_MS) return

    this.lastWarningAt = now
    console.warn('[observability] No se pudieron exportar logs OTLP al Collector.', {
      error: error?.message ?? 'Error desconocido',
    })
  }
}
