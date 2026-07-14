import * as Sentry from '@sentry/node'

import { SENTRY_REPORTING_ENABLED } from '@/config/enviroment'

import { HealthCheck, HealthCheckResult } from '../../../domain/health-check'

export class SentryHealthCheckAdapter implements HealthCheck {
  readonly name = 'sentry'

  async check(): Promise<HealthCheckResult> {
    const start = Date.now()

    if (!SENTRY_REPORTING_ENABLED) {
      return {
        name: this.name,
        status: 'skipped',
        latencyMs: Date.now() - start,
        details: { reason: 'SENTRY_REPORTING_ENABLED=false' },
      }
    }

    const client = Sentry.getClient()

    return {
      name: this.name,
      status: client ? 'up' : 'down',
      latencyMs: Date.now() - start,
      details: { provider: 'sentry' },
      error: client ? undefined : 'Sentry SDK no tiene cliente inicializado',
    }
  }
}
