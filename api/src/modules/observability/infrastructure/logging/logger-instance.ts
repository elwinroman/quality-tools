import { Logger } from '@observability/domain/logger'

import { createLoggerComposition, LoggerComposition } from './composition-root'

/**
 * Singleton de infraestructura para no crear transports por cada dependencia.
 * La seleccion de adapters concretos vive en composition-root.ts.
 */
class LoggerSingleton {
  private static composition: LoggerComposition

  private constructor() {}

  public static getInstance(): Logger {
    return LoggerSingleton.getComposition().logger
  }

  public static async shutdown(): Promise<void> {
    await LoggerSingleton.composition?.shutdown()
  }

  private static getComposition(): LoggerComposition {
    if (!LoggerSingleton.composition) {
      LoggerSingleton.composition = createLoggerComposition()
    }

    return LoggerSingleton.composition
  }
}

export const logger = LoggerSingleton.getInstance()

export async function shutdownLogger(): Promise<void> {
  await LoggerSingleton.shutdown()
}
