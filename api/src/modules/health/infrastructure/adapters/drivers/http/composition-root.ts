import { GetHealthStatusUseCase } from '../../../../application/get-health-status.use-case'
import { OtlpHealthCheckAdapter } from '../../drivens/otlp-health-check.adapter'
import { SentryHealthCheckAdapter } from '../../drivens/sentry-health-check.adapter'
import { ValkeyHealthCheckAdapter } from '../../drivens/valkey-health-check.adapter'
import { HealthController } from './health.controller'

const compositionRoot = () => {
  const checks = [new ValkeyHealthCheckAdapter(), new OtlpHealthCheckAdapter(), new SentryHealthCheckAdapter()]
  const getHealthStatusUseCase = new GetHealthStatusUseCase(checks)
  const healthController = new HealthController(getHealthStatusUseCase)

  return { healthController }
}

export const { healthController } = compositionRoot()
