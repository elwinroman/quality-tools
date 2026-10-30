import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { ExpressLayerType } from '@opentelemetry/instrumentation-express'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor, type SpanProcessor } from '@opentelemetry/sdk-trace-base'

import {
  OTEL_DEPLOYMENT_ENV,
  OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
  OTEL_EXPORTER_OTLP_TRACES_ENDPOINT,
  OTEL_METRIC_EXPORT_INTERVAL,
  OTEL_METRIC_EXPORT_TIMEOUT,
  OTEL_METRICS_ENABLED,
  OTEL_RESOURCE_ATTRIBUTES,
  OTEL_SERVICE_NAME,
  OTEL_TRACES_ENABLED,
} from '@/config/enviroment'

import { buildOtelResource } from '../logging/opentelemetry/otel-resource'
import { RedactingSpanExporter } from './redacting-span-exporter'

let telemetrySdk: NodeSDK | null = null

export function startTelemetry(): void {
  if ((!OTEL_METRICS_ENABLED && !OTEL_TRACES_ENABLED) || telemetrySdk) return

  try {
    telemetrySdk = new NodeSDK({
      resource: buildOtelResource(OTEL_SERVICE_NAME, OTEL_DEPLOYMENT_ENV, OTEL_RESOURCE_ATTRIBUTES),
      // Sin esto NodeSDK activa [envDetector, processDetector, hostDetector], que agregan
      // process.command_args (la linea de comandos completa), process.executable.*, process.pid
      // y host.* a cada senal. Es ruido de alta cardinalidad y no lo consume ningun tablero.
      // OTEL_RESOURCE_ATTRIBUTES ya se parsea en buildOtelResource, asi que envDetector es redundante.
      autoDetectResources: false,
      // Un array vacío desactiva la señal sin consultar OTEL_*_EXPORTER del entorno.
      metricReaders: buildMetricReaders(),
      spanProcessors: buildSpanProcessors(),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
          // dns y net generan un span por cada resolucion DNS y por cada conexion TCP: alto
          // volumen y ningun valor para diagnosticar la aplicacion. El span de la query ya lo
          // aporta la instrumentacion de tedious.
          '@opentelemetry/instrumentation-dns': { enabled: false },
          '@opentelemetry/instrumentation-net': { enabled: false },
          // Los preflight CORS (OPTIONS) no son trafico de negocio y ensucian la lista de traces.
          '@opentelemetry/instrumentation-http': { ignoreIncomingRequestHook: shouldIgnoreIncomingRequest },
          // Los layers de middleware internos de Express (query, expressInit, parsers) generan
          // spans que no aportan al diagnóstico. Se conservan los spans de router y de request handler.
          '@opentelemetry/instrumentation-express': { ignoreLayersType: [ExpressLayerType.MIDDLEWARE] },
        }),
      ],
    })

    telemetrySdk.start()
  } catch (err) {
    telemetrySdk = null
    console.warn('[observability] No se pudo iniciar OpenTelemetry.', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

export async function shutdownTelemetry(): Promise<void> {
  await telemetrySdk?.shutdown()
}

function buildMetricReaders(): PeriodicExportingMetricReader[] {
  if (!OTEL_METRICS_ENABLED) return []

  return [
    new PeriodicExportingMetricReader({
      exporter: new OTLPMetricExporter({
        url: buildMetricsEndpointUrl(),
        timeoutMillis: OTEL_METRIC_EXPORT_TIMEOUT,
      }),
      exportIntervalMillis: OTEL_METRIC_EXPORT_INTERVAL,
      exportTimeoutMillis: OTEL_METRIC_EXPORT_TIMEOUT,
    }),
  ]
}

function buildSpanProcessors(): SpanProcessor[] {
  if (!OTEL_TRACES_ENABLED) return []

  return [new BatchSpanProcessor(new RedactingSpanExporter(new OTLPTraceExporter({ url: buildTracesEndpointUrl() })))]
}

function buildMetricsEndpointUrl(): string {
  if (OTEL_EXPORTER_OTLP_METRICS_ENDPOINT) return OTEL_EXPORTER_OTLP_METRICS_ENDPOINT

  const baseEndpoint = OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')
  return `${baseEndpoint}/v1/metrics`
}

export function buildTracesEndpointUrl(): string {
  if (OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) return OTEL_EXPORTER_OTLP_TRACES_ENDPOINT

  const baseEndpoint = OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')
  return `${baseEndpoint}/v1/traces`
}

/**
 * Descarta el preflight CORS (OPTIONS) de traces: no es trafico de negocio y duplica
 * cada request del frontend en la lista de traces.
 */
export function shouldIgnoreIncomingRequest(request: { method?: string }): boolean {
  return request.method === 'OPTIONS'
}
