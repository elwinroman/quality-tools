export type HealthCheckStatus = 'up' | 'down' | 'skipped'

export interface HealthCheckResult {
  name: string
  status: HealthCheckStatus
  latencyMs: number
  details?: Record<string, unknown>
  error?: string
}

export interface HealthCheck {
  name: string
  check(): Promise<HealthCheckResult>
}
