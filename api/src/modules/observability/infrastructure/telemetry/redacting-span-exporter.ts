import type { ReadableSpan, SpanExporter } from '@opentelemetry/sdk-trace-base'

import { normalizeSqlWhitespace, summarizeSqlSpanName } from './sql-span-summary'

type ExportResultCallback = Parameters<SpanExporter['export']>[1]

// El texto SQL se conserva a propósito para diagnóstico: las queries del repo son parametrizadas,
// así que db.statement/db.query.text exponen la forma de la query y no los valores.
// Solo se redacta db.user, el login de conexión, que es constante y no aporta.
const REDACTED_DB_ATTRIBUTES = ['db.user'] as const

/**
 * Devuelve una copia del span sin el login de conexión, preservando el resto de la metadata.
 */
export function redactSpan(span: ReadableSpan): ReadableSpan {
  const isDatabaseSpan = 'db.system' in span.attributes || 'db.system.name' in span.attributes
  const attributes = Object.fromEntries(
    Object.entries(span.attributes)
      .filter(([key]) => !REDACTED_DB_ATTRIBUTES.some(redacted => redacted === key))
      .map(([key, value]) => [
        key,
        isDatabaseSpan && (key === 'db.statement' || key === 'db.query.text') && typeof value === 'string'
          ? normalizeSqlWhitespace(value)
          : value,
      ]),
  ) as ReadableSpan['attributes']
  const name = isDatabaseSpan
    ? (summarizeSqlSpanName(String(span.attributes['db.statement'] ?? span.attributes['db.query.text'] ?? '')) ?? span.name)
    : span.name

  // Copia explícita: un spread perdería los getters y métodos que viven en el prototipo del span real.
  return {
    name,
    kind: span.kind,
    spanContext: () => span.spanContext(),
    parentSpanContext: span.parentSpanContext,
    startTime: span.startTime,
    endTime: span.endTime,
    status: span.status,
    attributes,
    links: span.links,
    events: span.events,
    duration: span.duration,
    ended: span.ended,
    resource: span.resource,
    instrumentationScope: span.instrumentationScope,
    droppedAttributesCount: span.droppedAttributesCount,
    droppedEventsCount: span.droppedEventsCount,
    droppedLinksCount: span.droppedLinksCount,
  }
}

/**
 * Envuelve un exporter para redactar los spans justo antes de que salgan del proceso.
 */
export class RedactingSpanExporter implements SpanExporter {
  constructor(private readonly delegate: SpanExporter) {}

  export(spans: ReadableSpan[], resultCallback: ExportResultCallback): void {
    this.delegate.export(spans.map(redactSpan), resultCallback)
  }

  shutdown(): Promise<void> {
    return this.delegate.shutdown()
  }

  forceFlush(): Promise<void> {
    return this.delegate.forceFlush?.() ?? Promise.resolve()
  }
}
