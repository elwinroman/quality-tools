import { ALLOWED_ORIGINS, PORT } from './config/enviroment'
import { shutdownLogger } from './modules/observability/infrastructure/logging/logger-instance'
import { shutdownMetricsTelemetry, startMetricsTelemetry } from './modules/observability/infrastructure/metrics/opentelemetry-metrics'

async function bootstrap(): Promise<void> {
  // La autoinstrumentacion OTEL debe iniciar antes de importar Express/HTTP.
  startMetricsTelemetry()

  const [{ createAllRouter }, { Server }] = await Promise.all([import('./config/all.route'), import('./config/server.controller')])

  new Server({
    port: PORT,
    routes: createAllRouter(),
    allowedOrigins: ALLOWED_ORIGINS,
  }).start()
}

async function shutdown(): Promise<void> {
  // Cierre ordenado: permite hacer flush de logs/metricas OTLP antes de terminar el proceso.
  await shutdownMetricsTelemetry()
  await shutdownLogger()
  process.exit(0)
}

void bootstrap()

// SIGINT: Ctrl+C local. SIGTERM: Docker/Kubernetes/PM2 solicitan apagado.
process.once('SIGINT', () => void shutdown())
process.once('SIGTERM', () => void shutdown())
