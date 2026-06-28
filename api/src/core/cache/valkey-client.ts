import { CacheConnectionErrorException } from '@core/exceptions'
import { logger } from '@observability/infrastructure/logging/logger-instance'
import Valkey from 'iovalkey'

import { CACHE_HOST, CACHE_PASSWORD, CACHE_PORT } from '@/config/enviroment'

let retryCount = 0
const maxRetries = 100 // maximos intentos de reconexión
const logRetryThreshold = 3 // primeros 3 intentos se registra el log
const logEveryN = 10 // registra cada 10 intentos

export const valkeyClient = new Valkey({
  port: CACHE_PORT,
  host: CACHE_HOST,
  password: CACHE_PASSWORD,
  retryStrategy(_times: number) {
    retryCount++

    const shouldLog = retryCount <= logRetryThreshold || retryCount % logEveryN === 0
    if (shouldLog) logger.warn(`[cache] Reintentando conexión a ioValkey (intento #${retryCount})`)

    // detener después de X reintentos
    if (retryCount > maxRetries) {
      logger.fatal(`[cache] Máximo de reintentos (${maxRetries}) alcanzado`)
      process.exit(1) // detiene reconexión
    }

    return Math.min(retryCount * 100, 100)
  },
})

/** Eventos */
valkeyClient.on('connect', () => {
  logger.debug('[cache] Conectado a ioValkey')
})

valkeyClient.on('error', (err: Error) => {
  if (retryCount < 1) {
    const error = new CacheConnectionErrorException(err.message)

    logger.debug(error.message, { err })
    logger.warn(error.message, { err: error })
  }
})

valkeyClient.on('end', () => {
  logger.fatal('[cache] La conexión a ioValkey fue cerrada permanentemente')
})
