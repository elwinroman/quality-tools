/**
 * Estados reales conocidos de Query Store según `sys.database_query_store_options`.
 * Fuente única de verdad; el tipo se deriva de aquí y se aceptan valores nuevos del motor.
 */
export const QueryStoreActualStateList = {
  READ_WRITE: 'READ_WRITE',
  READ_ONLY: 'READ_ONLY',
  READ_CAPTURE_SECONDARY: 'READ_CAPTURE_SECONDARY',
  OFF: 'OFF',
  ERROR: 'ERROR',
} as const

export type KnownQueryStoreActualState = (typeof QueryStoreActualStateList)[keyof typeof QueryStoreActualStateList]

/** Estado operativo real; incluye los conocidos y cualquier texto nuevo que reporte un motor más reciente. */
export type QueryStoreActualState = KnownQueryStoreActualState | (string & {})

/** Estados deseados conocidos de Query Store. */
export const QueryStoreDesiredStateList = {
  READ_WRITE: 'READ_WRITE',
  READ_ONLY: 'READ_ONLY',
  READ_CAPTURE_SECONDARY: 'READ_CAPTURE_SECONDARY',
  OFF: 'OFF',
} as const

export type KnownQueryStoreDesiredState = (typeof QueryStoreDesiredStateList)[keyof typeof QueryStoreDesiredStateList]

/** Estado deseado configurado; puede diferir del estado real y acepta valores nuevos del motor. */
export type QueryStoreDesiredState = KnownQueryStoreDesiredState | (string & {})

/** Modos de captura conocidos de Query Store. */
export const QueryStoreCaptureModeList = {
  ALL: 'ALL',
  AUTO: 'AUTO',
  CUSTOM: 'CUSTOM',
  NONE: 'NONE',
} as const

export type KnownQueryStoreCaptureMode = (typeof QueryStoreCaptureModeList)[keyof typeof QueryStoreCaptureModeList]

/** Modo de captura de consultas configurado; se aceptan valores nuevos del motor. */
export type QueryStoreCaptureMode = KnownQueryStoreCaptureMode | (string & {})

/** Rango temporal UTC semiabierto `[fromUtc, toUtcExclusive)`. */
export interface UtcRange {
  fromUtc: Date
  toUtcExclusive: Date
}

/** Bitmap observable de `readonly_reason`; cada bit describe una causa de sólo lectura. */
export const READONLY_REASON_FLAGS: ReadonlyArray<readonly [number, string]> = [
  [1, 'read_only_database'],
  [2, 'single_user_mode'],
  [4, 'emergency_mode'],
  [8, 'secondary_replica'],
  [65536, 'size_limit_reached'],
  [131072, 'too_many_statements_in_memory'],
  [262144, 'in_memory_items_awaiting_flush'],
  [524288, 'database_disk_limit'],
]

/** Bit que indica elementos en memoria pendientes de volcado a disco. */
export const READONLY_REASON_IN_MEMORY_BACKLOG = 262144

/** Traduce el bitmap a códigos estables; agrega `unknown_readonly_reason` si quedan bits no mapeados. */
export function decodeReadonlyReasons(reason: number): string[] {
  if (!Number.isFinite(reason) || reason <= 0) return []
  const decoded: string[] = []
  let knownMask = 0
  for (const [bit, code] of READONLY_REASON_FLAGS) {
    knownMask |= bit
    if ((reason & bit) !== 0) decoded.push(code)
  }
  if ((reason & ~knownMask) !== 0) decoded.push('unknown_readonly_reason')
  return decoded
}

/**
 * Configuración observable de Query Store para la base de datos actual.
 * Es sólo lectura: refleja lo que el motor reporta y no infiere estados no observables
 * como limpieza en curso o filas en memoria frente a disco.
 */
export interface QueryStoreConfiguration {
  actualState: QueryStoreActualState
  desiredState: QueryStoreDesiredState

  /** Bitmap crudo de `readonly_reason`; para los códigos legibles usar `readonlyReasons`. */
  readonlyReason: number

  /** Causas de sólo lectura decodificadas; incluye `in_memory_items_awaiting_flush` cuando hay backlog. */
  readonlyReasons: string[]

  intervalLengthMinutes: number
  staleQueryThresholdDays: number
  queryCaptureMode: QueryStoreCaptureMode
  sizeBasedCleanupMode: string
  waitStatsCaptureMode: string
  currentStorageSizeMb: number
  maxStorageSizeMb: number
  flushIntervalSeconds: number
}

/**
 * Intervalo de runtime de Query Store identificado por su fila real.
 * Si `endUtc` es posterior al instante observado, el intervalo sigue abierto (puede contener memoria y disco).
 */
export interface QueryStoreRuntimeInterval {
  id: number
  startUtc: Date
  endUtc: Date
}

/**
 * Lectura de Query Store: configuración, TODOS los intervalos retenidos y el instante UTC con el que
 * el motor clasificó los intervalos cerrados frente al abierto.
 * No hay ventana fija: la disponibilidad se define por los datos que existen realmente.
 */
export interface QueryStoreOptionsContext {
  configuration: QueryStoreConfiguration | null
  retainedIntervals: QueryStoreRuntimeInterval[]

  /** Instante UTC autoritativo de la base de datos (una sola evaluación), reutilizado para clasificar intervalos. */
  observedAtUtc: Date
}
