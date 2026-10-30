import type { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import type { MSSQLExecutor } from '@core/store/mssql-query-runner'

import type { ForQueryStoreOptionsRepositoryPort } from '@/modules/performance/domain/ports/drivens/for-query-store-options-repository.port'
import type { QueryStoreOptionsContext } from '@/modules/performance/domain/query-store-options'

import {
  queryStoreConfigurationRowMapper,
  QueryStoreConfigurationRowSchema,
  QueryStoreObservedAtRowSchema,
  queryStoreRuntimeIntervalRowMapper,
  QueryStoreRuntimeIntervalRowSchema,
} from './query-store-options.mapper'

/**
 * Lectura sin ventana fija: todos los intervalos retenidos, ordenados, más la configuración observable.
 * El instante UTC se declara UNA vez con la hora de la base y se reutiliza en el predicado y como resultado.
 */
export const QUERY_STORE_OPTIONS_QUERY = `
  DECLARE @observedAtUtc datetimeoffset(7) = CAST(SYSUTCDATETIME() AS datetimeoffset(7));

  SELECT
    actual_state_desc,
    desired_state_desc,
    readonly_reason,
    current_storage_size_mb,
    max_storage_size_mb,
    flush_interval_seconds,
    interval_length_minutes,
    stale_query_threshold_days,
    size_based_cleanup_mode_desc,
    query_capture_mode_desc,
    wait_stats_capture_mode_desc
  FROM sys.database_query_store_options;

  SELECT
    runtime_stats_interval_id,
    start_time,
    end_time
  FROM sys.query_store_runtime_stats_interval
  WHERE start_time <= @observedAtUtc
  ORDER BY start_time ASC, end_time ASC, runtime_stats_interval_id ASC;

  SELECT @observedAtUtc AS observed_at_utc;
`

export class MssqlQueryStoreOptionsRepositoryAdapter implements ForQueryStoreOptionsRepositoryPort {
  constructor(
    private readonly executor: MSSQLExecutor,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
  ) {}

  async findOptionsContext(): Promise<QueryStoreOptionsContext> {
    const { store } = await this.currentStoreContextResolver.resolve()

    const result = await this.executor.query<unknown>({
      credentials: store.credentials,
      userType: store.type,
      statement: QUERY_STORE_OPTIONS_QUERY,
    })

    const configurationRows = QueryStoreConfigurationRowSchema.array()
      .max(1)
      .parse(result.recordsets[0] ?? [])

    const intervalRows = QueryStoreRuntimeIntervalRowSchema.array().parse(result.recordsets[1] ?? [])

    const observedAtRows = QueryStoreObservedAtRowSchema.array()
      .length(1)
      .parse(result.recordsets[2] ?? [])

    return {
      configuration: configurationRows[0] ? queryStoreConfigurationRowMapper(configurationRows[0]) : null,
      retainedIntervals: intervalRows.map(queryStoreRuntimeIntervalRowMapper),
      observedAtUtc: observedAtRows[0].observed_at_utc,
    }
  }
}
