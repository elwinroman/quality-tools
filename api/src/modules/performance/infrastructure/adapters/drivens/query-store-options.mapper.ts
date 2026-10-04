import { z } from 'zod'

import type { QueryStoreConfiguration, QueryStoreRuntimeInterval } from '@/modules/performance/domain/query-store-options'
import { decodeReadonlyReasons } from '@/modules/performance/domain/query-store-options'
import {
  MssqlNonNegativeFiniteNumberSchema,
  MssqlNonNegativeSafeIntegerSchema,
  MssqlPositiveSafeIntegerSchema,
} from '@/modules/performance/utils/mssql-value.schema'

/**
 * Texto de estado/modo de Query Store. Se acepta cualquier texto no vacío para no romper con motores
 * que reporten valores nuevos; los valores conocidos viven en `QueryStoreActualStateList`,
 * `QueryStoreDesiredStateList` y `QueryStoreCaptureModeList`.
 */
const QueryStoreStateTextSchema = z.string().trim().min(1)

/** Sólo valida forma y tipo de las columnas requeridas; tolera columnas extra del motor. */
export const QueryStoreConfigurationRowSchema = z.object({
  actual_state_desc: QueryStoreStateTextSchema,
  desired_state_desc: QueryStoreStateTextSchema,
  readonly_reason: MssqlNonNegativeSafeIntegerSchema,
  current_storage_size_mb: MssqlNonNegativeFiniteNumberSchema,
  max_storage_size_mb: MssqlNonNegativeFiniteNumberSchema,
  flush_interval_seconds: MssqlNonNegativeSafeIntegerSchema,
  interval_length_minutes: MssqlPositiveSafeIntegerSchema,
  stale_query_threshold_days: MssqlNonNegativeSafeIntegerSchema,
  size_based_cleanup_mode_desc: QueryStoreStateTextSchema,
  query_capture_mode_desc: QueryStoreStateTextSchema,
  wait_stats_capture_mode_desc: QueryStoreStateTextSchema,
})

export type QueryStoreConfigurationRow = z.infer<typeof QueryStoreConfigurationRowSchema>

export const QueryStoreRuntimeIntervalRowSchema = z.object({
  runtime_stats_interval_id: MssqlPositiveSafeIntegerSchema,
  start_time: z.date(),
  end_time: z.date(),
})

export type QueryStoreRuntimeIntervalRow = z.infer<typeof QueryStoreRuntimeIntervalRowSchema>

/** Fila única con el instante UTC evaluado una sola vez por el motor. */
export const QueryStoreObservedAtRowSchema = z.object({
  observed_at_utc: z.date(),
})

export function queryStoreConfigurationRowMapper(row: QueryStoreConfigurationRow): QueryStoreConfiguration {
  return {
    actualState: row.actual_state_desc,
    desiredState: row.desired_state_desc,
    readonlyReason: row.readonly_reason,
    readonlyReasons: decodeReadonlyReasons(row.readonly_reason),
    intervalLengthMinutes: row.interval_length_minutes,
    staleQueryThresholdDays: row.stale_query_threshold_days,
    queryCaptureMode: row.query_capture_mode_desc,
    sizeBasedCleanupMode: row.size_based_cleanup_mode_desc,
    waitStatsCaptureMode: row.wait_stats_capture_mode_desc,
    currentStorageSizeMb: row.current_storage_size_mb,
    maxStorageSizeMb: row.max_storage_size_mb,
    flushIntervalSeconds: row.flush_interval_seconds,
  }
}

export function queryStoreRuntimeIntervalRowMapper(row: QueryStoreRuntimeIntervalRow): QueryStoreRuntimeInterval {
  return {
    id: row.runtime_stats_interval_id,
    startUtc: row.start_time,
    endUtc: row.end_time,
  }
}
