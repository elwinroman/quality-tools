import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { NodeSDK } from '@opentelemetry/sdk-node'

import {
  OTEL_DEPLOYMENT_ENV,
  OTEL_EXPORTER_OTLP_ENDPOINT,
  OTEL_EXPORTER_OTLP_METRICS_ENDPOINT,
  OTEL_METRIC_EXPORT_INTERVAL,
  OTEL_METRIC_EXPORT_TIMEOUT,
  OTEL_METRICS_ENABLED,
  OTEL_RESOURCE_ATTRIBUTES,
  OTEL_SERVICE_NAME,
} from '@/config/enviroment'

import { buildOtelResource } from '../logging/opentelemetry/otel-resource'

let metricsSdk: NodeSDK | null = null

export function startMetricsTelemetry(): void {
  if (!OTEL_METRICS_ENABLED || metricsSdk) return

  const metricsEndpointUrl = buildMetricsEndpointUrl()

  try {
    // Esta fase habilita solo metricas; traces se configuraran aparte cuando se implemente Tempo.
    process.env.OTEL_TRACES_EXPORTER ??= 'none'

    metricsSdk = new NodeSDK({
      resource: buildOtelResource(OTEL_SERVICE_NAME, OTEL_DEPLOYMENT_ENV, OTEL_RESOURCE_ATTRIBUTES),
      metricReaders: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({
            url: metricsEndpointUrl,
            timeoutMillis: OTEL_METRIC_EXPORT_TIMEOUT,
          }),
          exportIntervalMillis: OTEL_METRIC_EXPORT_INTERVAL,
          exportTimeoutMillis: OTEL_METRIC_EXPORT_TIMEOUT,
        }),
      ],
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    })

    metricsSdk.start()
  } catch (err) {
    metricsSdk = null
    console.warn('[observability] No se pudo iniciar OpenTelemetry metrics.', {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

export async function shutdownMetricsTelemetry(): Promise<void> {
  await metricsSdk?.shutdown()
}

function buildMetricsEndpointUrl(): string {
  if (OTEL_EXPORTER_OTLP_METRICS_ENDPOINT) return OTEL_EXPORTER_OTLP_METRICS_ENDPOINT

  const baseEndpoint = OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')
  return `${baseEndpoint}/v1/metrics`
}
