import { HealthCheck, HealthCheckResult } from '../domain/health-check'

export interface HealthStatus {
  status: 'ok' | 'degraded'
  uptimeSeconds: number
  timestamp: string
  summary: {
    total: number
    up: number
    down: number
    disabled: number
    disabledServices: string[]
  }
  checks: HealthCheckResult[]
}

export class GetHealthStatusUseCase {
  constructor(private readonly checks: HealthCheck[]) {}

  async execute(): Promise<HealthStatus> {
    const checks = await Promise.all(this.checks.map(check => check.check()))
    const hasDownCheck = checks.some(check => check.status === 'down')
    const disabledServices = checks.filter(check => check.status === 'skipped').map(check => check.name)

    return {
      status: hasDownCheck ? 'degraded' : 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      summary: {
        total: checks.length,
        up: checks.filter(check => check.status === 'up').length,
        down: checks.filter(check => check.status === 'down').length,
        disabled: disabledServices.length,
        disabledServices,
      },
      checks,
    }
  }
}
