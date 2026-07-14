import { valkeyClient } from '@core/cache/valkey-client'

import { HealthCheck, HealthCheckResult } from '../../../domain/health-check'

export class ValkeyHealthCheckAdapter implements HealthCheck {
  readonly name = 'cache'

  async check(): Promise<HealthCheckResult> {
    const start = Date.now()

    try {
      const response = await valkeyClient.ping()

      return {
        name: this.name,
        status: response === 'PONG' ? 'up' : 'down',
        latencyMs: Date.now() - start,
        details: { provider: 'valkey', response },
      }
    } catch (err) {
      return {
        name: this.name,
        status: 'down',
        latencyMs: Date.now() - start,
        details: { provider: 'valkey' },
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }
}
