import { ApplicationError } from '@shared/application/application-error'

import { type QueryStoreActualState, QueryStoreActualStateList } from '@/modules/performance/domain/query-store-options'

/**
 * Causa de indisponibilidad: configuración ausente o un estado real que bloquea el informe.
 * El tipo acepta cualquier estado observado porque el estado real no se estrecha en el `if`;
 * en la práctica sólo `QueryStoreActualStateList.OFF` y `.ERROR` producen esta excepción.
 */
export type QueryStoreUnavailableReason = 'missing_configuration' | QueryStoreActualState

/** Detalle orientado al usuario por causa, con fallback para estados desconocidos del motor. */
const DETAIL_BY_REASON: Readonly<Record<string, string>> = {
  missing_configuration: 'No se pudo obtener la configuración de Query Store para la base de datos actual.',
  [QueryStoreActualStateList.OFF]: 'Query Store está desactivado en la base de datos actual; no hay métricas disponibles para el reporte.',
  [QueryStoreActualStateList.ERROR]: 'Query Store entró en un estado de error en la base de datos actual y no puede generar el reporte.',
}

export class QueryStoreUnavailableException extends ApplicationError {
  readonly type = 'QueryStoreUnavailableException'
  static readonly title = 'Query Store no disponible'
  readonly detail: string
  static readonly metadata = { status: 409, errorCode: 6000 }

  constructor(reason: QueryStoreUnavailableReason) {
    super(`[performance] Query Store no disponible: ${reason}`)
    this.detail = DETAIL_BY_REASON[reason] ?? `Query Store no está disponible (estado ${reason}).`
  }
}
