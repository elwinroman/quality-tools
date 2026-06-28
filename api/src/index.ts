import { createAllRouter } from './config/all.route'
import { ALLOWED_ORIGINS, PORT } from './config/enviroment'
import { Server } from './config/server.controller'
import { shutdownLogger } from './modules/observability/infrastructure/logging/logger-instance'

new Server({
  port: PORT,
  routes: createAllRouter(),
  allowedOrigins: ALLOWED_ORIGINS,
}).start()

async function shutdown(): Promise<void> {
  // Cierre ordenado: permite hacer flush de logs OTLP antes de terminar el proceso.
  await shutdownLogger()
  process.exit(0)
}

// SIGINT: Ctrl+C local. SIGTERM: Docker/Kubernetes/PM2 solicitan apagado.
process.once('SIGINT', () => void shutdown())
process.once('SIGTERM', () => void shutdown())
