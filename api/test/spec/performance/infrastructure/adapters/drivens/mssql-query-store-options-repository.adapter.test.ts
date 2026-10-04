import type { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { UserTypeEnum } from '@core/store/mssql-database-connection'
import type { MSSQLExecutor, MSSQLQueryCommand } from '@core/store/mssql-query-runner'
import { describe, expect, it, vi } from 'vitest'

import {
  QueryStoreActualStateList,
  QueryStoreCaptureModeList,
  QueryStoreDesiredStateList,
} from '@/modules/performance/domain/query-store-options'
import {
  MssqlQueryStoreOptionsRepositoryAdapter,
  QUERY_STORE_OPTIONS_QUERY,
} from '@/modules/performance/infrastructure/adapters/drivens/mssql-query-store-options-repository.adapter'

const credentials = { host: 'host', database: 'Quality', user: 'user', password: 'password' }
const OBSERVED_AT_UTC = new Date('2026-10-01T00:00:00.000Z')
const CONFIGURATION_ROW = {
  actual_state_desc: QueryStoreActualStateList.READ_ONLY,
  desired_state_desc: QueryStoreDesiredStateList.READ_WRITE,
  readonly_reason: '262144',
  current_storage_size_mb: '100.5',
  max_storage_size_mb: '1000',
  flush_interval_seconds: '900',
  interval_length_minutes: '60',
  stale_query_threshold_days: '30',
  size_based_cleanup_mode_desc: 'AUTO',
  query_capture_mode_desc: QueryStoreCaptureModeList.NONE,
  wait_stats_capture_mode_desc: 'ON',
}
const INTERVAL_ROW = {
  runtime_stats_interval_id: '42',
  start_time: new Date('2026-09-22T01:00:00.000Z'),
  end_time: new Date('2026-09-22T02:00:00.000Z'),
}
const OBSERVED_AT_ROW = { observed_at_utc: OBSERVED_AT_UTC }

function createFixture(
  configurationRows: unknown[] = [CONFIGURATION_ROW],
  intervalRows: unknown[] = [INTERVAL_ROW],
  observedAtRows: unknown[] = [OBSERVED_AT_ROW],
) {
  const query = vi.fn(async (_command: MSSQLQueryCommand) => ({ recordsets: [configurationRows, intervalRows, observedAtRows] }))
  const executor: MSSQLExecutor = {
    query: query as unknown as MSSQLExecutor['query'],
    execute: vi.fn() as MSSQLExecutor['execute'],
  }
  const resolve = vi.fn(async () => ({
    authContext: { userId: 1, sessionId: 'session' },
    store: { credentials, type: UserTypeEnum.External },
  }))
  const currentStoreContextResolver: CurrentStoreContextResolver = { resolve }
  const adapter = new MssqlQueryStoreOptionsRepositoryAdapter(executor, currentStoreContextResolver)
  return { adapter, query, resolve }
}

describe('MssqlQueryStoreOptionsRepositoryAdapter', () => {
  it('uses current-store credentials with no parameters and returns the observed timestamp', async () => {
    const { adapter, query, resolve } = createFixture()

    await adapter.findOptionsContext()

    expect(resolve).toHaveBeenCalledOnce()
    const command = query.mock.calls[0][0]
    expect(command.credentials).toBe(credentials)
    expect(command.userType).toBe(UserTypeEnum.External)
    expect(command.parameters).toBeUndefined()
  })

  it('strictly maps the configuration surface, every retained interval, and the observed timestamp', async () => {
    const { adapter } = createFixture()

    await expect(adapter.findOptionsContext()).resolves.toEqual({
      configuration: {
        actualState: QueryStoreActualStateList.READ_ONLY,
        desiredState: QueryStoreDesiredStateList.READ_WRITE,
        readonlyReason: 262144,
        readonlyReasons: ['in_memory_items_awaiting_flush'],
        intervalLengthMinutes: 60,
        staleQueryThresholdDays: 30,
        queryCaptureMode: QueryStoreCaptureModeList.NONE,
        sizeBasedCleanupMode: 'AUTO',
        waitStatsCaptureMode: 'ON',
        currentStorageSizeMb: 100.5,
        maxStorageSizeMb: 1000,
        flushIntervalSeconds: 900,
      },
      retainedIntervals: [{ id: 42, startUtc: INTERVAL_ROW.start_time, endUtc: INTERVAL_ROW.end_time }],
      observedAtUtc: OBSERVED_AT_UTC,
    })
  })

  it.each([
    [1, ['read_only_database']],
    [65536, ['size_limit_reached']],
    [65536 + 262144, ['size_limit_reached', 'in_memory_items_awaiting_flush']],
    [0, []],
    [1048576, ['unknown_readonly_reason']],
  ])('decodes readonly_reason %i into %j', async (readonlyReason, expected) => {
    const { adapter } = createFixture([{ ...CONFIGURATION_ROW, readonly_reason: String(readonlyReason) }], [])

    await expect(adapter.findOptionsContext()).resolves.toMatchObject({
      configuration: { readonlyReasons: expected, readonlyReason },
    })
  })

  it('returns null configuration when the options recordset is empty', async () => {
    const { adapter } = createFixture([], [])

    await expect(adapter.findOptionsContext()).resolves.toEqual({
      configuration: null,
      retainedIntervals: [],
      observedAtUtc: OBSERVED_AT_UTC,
    })
  })

  it('declares the observed timestamp once, reuses it, and returns it', () => {
    expect(QUERY_STORE_OPTIONS_QUERY).toContain('DECLARE @observedAtUtc datetimeoffset(7) = CAST(SYSUTCDATETIME() AS datetimeoffset(7))')
    expect(QUERY_STORE_OPTIONS_QUERY).toContain('start_time <= @observedAtUtc')
    expect(QUERY_STORE_OPTIONS_QUERY).not.toContain('start_time >= @')
    expect(QUERY_STORE_OPTIONS_QUERY).toContain('SELECT @observedAtUtc AS observed_at_utc')
    expect(QUERY_STORE_OPTIONS_QUERY).toContain('ORDER BY start_time ASC, end_time ASC')
    expect(QUERY_STORE_OPTIONS_QUERY.match(/DECLARE @observedAtUtc/g)).toHaveLength(1)
  })

  it('tolerates extra columns in configuration, interval, and observed-at rows', async () => {
    const { adapter } = createFixture(
      [{ ...CONFIGURATION_ROW, future_column: 'x' }],
      [{ ...INTERVAL_ROW, future_column: 'y' }],
      [{ ...OBSERVED_AT_ROW, future_column: 'z' }],
    )

    await expect(adapter.findOptionsContext()).resolves.toMatchObject({ retainedIntervals: [{ id: 42 }] })
  })

  it('accepts unknown actual_state_desc and query_capture_mode_desc values', async () => {
    const { adapter } = createFixture(
      [{ ...CONFIGURATION_ROW, actual_state_desc: 'NEW_ENGINE_STATE', query_capture_mode_desc: 'FUTURE_MODE' }],
      [],
    )

    await expect(adapter.findOptionsContext()).resolves.toMatchObject({
      configuration: { actualState: 'NEW_ENGINE_STATE', queryCaptureMode: 'FUTURE_MODE' },
    })
  })

  it('rejects a null interval id through type parsing', async () => {
    const { adapter } = createFixture([CONFIGURATION_ROW], [{ ...INTERVAL_ROW, runtime_stats_interval_id: null }])

    await expect(adapter.findOptionsContext()).rejects.toThrow()
  })

  it('rejects a null readonly_reason through type parsing', async () => {
    const { adapter } = createFixture([{ ...CONFIGURATION_ROW, readonly_reason: null }], [])

    await expect(adapter.findOptionsContext()).rejects.toThrow()
  })

  it('rejects a null observed_at_utc', async () => {
    const { adapter } = createFixture([CONFIGURATION_ROW], [], [{ observed_at_utc: null }])

    await expect(adapter.findOptionsContext()).rejects.toThrow()
  })

  it('rejects a malformed configuration value through type parsing', async () => {
    const { adapter } = createFixture([{ ...CONFIGURATION_ROW, readonly_reason: 'not-a-number' }], [])

    await expect(adapter.findOptionsContext()).rejects.toThrow()
  })

  it('maps READ_CAPTURE_SECONDARY as a documented report-capable state', async () => {
    const secondaryConfiguration = {
      ...CONFIGURATION_ROW,
      actual_state_desc: QueryStoreActualStateList.READ_CAPTURE_SECONDARY,
      desired_state_desc: QueryStoreDesiredStateList.READ_CAPTURE_SECONDARY,
    }
    const { adapter } = createFixture([secondaryConfiguration], [])

    await expect(adapter.findOptionsContext()).resolves.toMatchObject({
      configuration: {
        actualState: QueryStoreActualStateList.READ_CAPTURE_SECONDARY,
        desiredState: QueryStoreDesiredStateList.READ_CAPTURE_SECONDARY,
      },
    })
  })
})
