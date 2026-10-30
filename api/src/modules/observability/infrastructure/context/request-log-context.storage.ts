import { AsyncLocalStorage } from 'node:async_hooks'

import { LoggerAuthContext, LoggerContextUpdate, LoggerSourceContext } from '@observability/domain/logger-context'
import { Request } from 'express'

/**
 * Contexto de una operación de base de datos en curso.
 *
 * Conserva el objeto capturado con `Error.captureStackTrace` (no un string ya formateado)
 * para diferir el formateo al momento en que un error se reporta. Además lleva la etiqueta
 * de la operación y el statement que se ejecutó, elegidos explícitamente por el ejecutor:
 * el comando nunca se copia entero, así que las credenciales y los valores de parámetros
 * jamás entran a este contexto.
 */
export interface DatabaseOperationCallsite {
  /** Etiqueta de la operación: `query` o `execute` (con respaldo si el comando no la expone). */
  operation: string
  /** Punto de llamada capturado con `Error.captureStackTrace`, sin formatear todavía. */
  stack?: string
  /** Statement (o nombre del procedimiento) que se está ejecutando. */
  statement: string
}

/**
 * Contexto tecnico por request.
 * Es detalle de infraestructura: Express abre el contexto y los loggers lo leen para enriquecer eventos.
 */
export interface LoggerRequestContext extends LoggerContextUpdate {
  correlationId: string
  source: LoggerSourceContext
  auth: LoggerAuthContext
  request: Request
  /**
   * Contexto de la operación de base de datos en curso.
   *
   * Limitación de un solo slot: el contexto guarda una única operación en vuelo por request.
   * Si un request disparara consultas en paralelo, la última en arrancar sobrescribiría el
   * punto de llamada y el reporte apuntaría a la consulta equivocada. El flujo actual es
   * secuencial, pero cualquier paralelización futura necesita un contexto por operación.
   */
  databaseOperationCallsite?: DatabaseOperationCallsite
}

export const requestLogContextStorage = new AsyncLocalStorage<LoggerRequestContext>()

export function runWithRequestLogContext(context: LoggerRequestContext, callback: () => void): void {
  requestLogContextStorage.run(context, callback)
}

export function updateRequestLogContext(newContext: Partial<LoggerRequestContext>): void {
  const currentContext = requestLogContextStorage.getStore()

  if (!currentContext) throw new Error('[logger] No hay contexto activo para logger. Usa el middleware inicial para crear uno.')

  const mergedContext = { ...currentContext, ...newContext }
  requestLogContextStorage.enterWith(mergedContext)
}

export function getRequestLogContext(): LoggerRequestContext | undefined {
  return requestLogContextStorage.getStore()
}

/**
 * Registra o limpia el punto de llamada de la operación de base de datos de la request.
 *
 * Sin contexto activo es un no-op: los escenarios fuera de una request (CLI, jobs) no lo necesitan.
 */
export function setDatabaseOperationCallsite(callsite: DatabaseOperationCallsite | undefined): void {
  const context = requestLogContextStorage.getStore()

  if (!context) return

  if (callsite) {
    context.databaseOperationCallsite = callsite
  } else {
    delete context.databaseOperationCallsite
  }
}
