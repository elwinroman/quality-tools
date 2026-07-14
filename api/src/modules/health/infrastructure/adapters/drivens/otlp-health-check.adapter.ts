import { OTEL_EXPORTER_OTLP_ENDPOINT, OTEL_EXPORTER_OTLP_LOGS_ENDPOINT, OTEL_LOGS_ENABLED } from '@/config/enviroment'

import { HealthCheck, HealthCheckResult } from '../../../domain/health-check'

export class OtlpHealthCheckAdapter implements HealthCheck {
  readonly name = 'otlp-logs'

  async check(): Promise<HealthCheckResult> {
    const start = Date.now()

    if (!OTEL_LOGS_ENABLED) {
      return {
        name: this.name,
        status: 'skipped',
        latencyMs: Date.now() - start,
        details: { reason: 'OTEL_LOGS_ENABLED=false' },
      }
    }

    const endpoint = buildLogsEndpointUrl()

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(2000),
      })

      const isReachable = response.ok || response.status === 400 || response.status === 415

      return {
        name: this.name,
        status: isReachable ? 'up' : 'down',
        latencyMs: Date.now() - start,
        details: { endpoint, httpStatus: response.status },
      }
    } catch (err) {
      return {
        name: this.name,
        status: 'down',
        latencyMs: Date.now() - start,
        details: { endpoint },
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}

function buildLogsEndpointUrl(): string {
  if (OTEL_EXPORTER_OTLP_LOGS_ENDPOINT) return OTEL_EXPORTER_OTLP_LOGS_ENDPOINT

  const baseEndpoint = OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, '')
  return `${baseEndpoint}/v1/logs`
}
