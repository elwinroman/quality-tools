import { ALLOWED_ORIGINS, PORT } from './config/enviroment'
import { shutdownLogger } from './modules/observability/infrastructure/logging/logger-instance'
import { shutdownTelemetry, startTelemetry } from './modules/observability/infrastructure/telemetry/opentelemetry-telemetry'

async function bootstrap(): Promise<void> {
  // La autoinstrumentacion OTEL debe iniciar antes de importar Express/HTTP.
  startTelemetry()

  const [{ createAllRouter }, { Server }] = await Promise.all([import('./config/all.route'), import('./config/server.controller')])

  new Server({
    port: PORT,
    routes: createAllRouter(),
    allowedOrigins: ALLOWED_ORIGINS,
  }).start()
}

async function shutdown(): Promise<void> {
  // Cierre ordenado: permite hacer flush de logs/metricas/traces OTLP antes de terminar el proceso.
  await shutdownTelemetry()
  await shutdownLogger()
  process.exit(0)
}

void bootstrap()

// SIGINT: Ctrl+C local. SIGTERM: Docker/Kubernetes/PM2 solicitan apagado.
process.once('SIGINT', () => void shutdown())
process.once('SIGTERM', () => void shutdown())
