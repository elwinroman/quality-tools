import { describe, expect, it, vi } from 'vitest'

import { QueryStoreUnavailableException } from '@/modules/performance/application/exceptions/query-store-unavailable.exception'
import { GetQueryStoreOptionsUseCase } from '@/modules/performance/application/use-cases/get-query-store-options.use-case'
import type { ForQueryStoreOptionsRepositoryPort } from '@/modules/performance/domain/ports/drivens/for-query-store-options-repository.port'
import {
  QueryStoreActualStateList,
  QueryStoreCaptureModeList,
  type QueryStoreConfiguration,
  QueryStoreDesiredStateList,
  type QueryStoreRuntimeInterval,
} from '@/modules/performance/domain/query-store-options'

const OBSERVED_AT_UTC = new Date('2026-10-01T00:00:00.000Z')
const CONFIGURATION: QueryStoreConfiguration = {
  actualState: QueryStoreActualStateList.READ_ONLY,
  desiredState: QueryStoreDesiredStateList.READ_WRITE,
  readonlyReason: 65536,
  readonlyReasons: ['size_limit_reached'],
  intervalLengthMinutes: 60,
  staleQueryThresholdDays: 30,
  queryCaptureMode: QueryStoreCaptureModeList.NONE,
  sizeBasedCleanupMode: 'AUTO',
  waitStatsCaptureMode: 'ON',
  currentStorageSizeMb: 100.5,
  maxStorageSizeMb: 1000,
  flushIntervalSeconds: 900,
}

function interval(id: number, start: string, end: string): QueryStoreRuntimeInterval {
  return { id, startUtc: new Date(start), endUtc: new Date(end) }
}

function createFixture(
  options: {
    configuration?: QueryStoreConfiguration | null
    intervals?: QueryStoreRuntimeInterval[]
  } = {},
) {
  const findOptionsContext = vi.fn(async () => ({
    configuration: options.configuration === undefined ? CONFIGURATION : options.configuration,
    retainedIntervals: options.intervals ?? [],
    observedAtUtc: OBSERVED_AT_UTC,
  }))
  const repository: ForQueryStoreOptionsRepositoryPort = { findOptionsContext }
  const useCase = new GetQueryStoreOptionsUseCase(repository)
  return { useCase, findOptionsContext }
}

describe('GetQueryStoreOptionsUseCase', () => {
  it('derives segments, availability, and gaps from real retained intervals without a fixed window', async () => {
    const intervals = [
      interval(1, '2026-09-30T20:00:00.000Z', '2026-09-30T21:00:00.000Z'),
      interval(2, '2026-09-30T21:00:00.000Z', '2026-09-30T22:00:00.000Z'),
      interval(3, '2026-09-30T23:00:00.000Z', '2026-10-01T00:00:00.000Z'),
    ]
    const { useCase, findOptionsContext } = createFixture({ intervals })

    const snapshot = await useCase.execute()
    const options = snapshot.options

    expect(findOptionsContext).toHaveBeenCalledOnce()
    expect(options.observedAtUtc).toEqual(OBSERVED_AT_UTC)
    expect(options.selectableSegments).toEqual([
      { fromUtc: new Date('2026-09-30T20:00:00.000Z'), toUtcExclusive: new Date('2026-09-30T22:00:00.000Z'), intervalCount: 2 },
      { fromUtc: new Date('2026-09-30T23:00:00.000Z'), toUtcExclusive: new Date('2026-10-01T00:00:00.000Z'), intervalCount: 1 },
    ])
    expect(options.availability).toEqual({
      oldestIntervalStartUtc: new Date('2026-09-30T20:00:00.000Z'),
      newestClosedIntervalEndUtc: new Date('2026-10-01T00:00:00.000Z'),
      openInterval: null,
      inMemoryBacklog: false,
    })
    expect(options.gaps).toEqual([{ fromUtc: new Date('2026-09-30T22:00:00.000Z'), toUtcExclusive: new Date('2026-09-30T23:00:00.000Z') }])
    expect(snapshot.copyExactIntervalSegments()).toHaveLength(2)
  })

  it('excludes the open interval from selectable segments', async () => {
    const intervals = [
      interval(1, '2026-09-30T23:00:00.000Z', '2026-10-01T00:00:00.000Z'),
      interval(2, '2026-10-01T00:00:00.000Z', '2026-10-01T01:00:00.000Z'),
    ]
    const { useCase } = createFixture({ intervals })

    const options = (await useCase.execute()).options

    expect(options.selectableSegments).toEqual([
      { fromUtc: new Date('2026-09-30T23:00:00.000Z'), toUtcExclusive: new Date('2026-10-01T00:00:00.000Z'), intervalCount: 1 },
    ])
    expect(options.availability.openInterval).toEqual({
      startUtc: new Date('2026-10-01T00:00:00.000Z'),
      expectedEndUtc: new Date('2026-10-01T01:00:00.000Z'),
    })
    expect(options.gaps).toEqual([])
  })

  it('reports a gap between a closed interval and the open interval', async () => {
    const intervals = [
      interval(1, '2026-09-30T20:00:00.000Z', '2026-09-30T21:00:00.000Z'),
      interval(2, '2026-10-01T00:00:00.000Z', '2026-10-01T01:00:00.000Z'),
    ]
    const { useCase } = createFixture({ intervals })

    const options = (await useCase.execute()).options

    expect(options.selectableSegments).toEqual([
      { fromUtc: new Date('2026-09-30T20:00:00.000Z'), toUtcExclusive: new Date('2026-09-30T21:00:00.000Z'), intervalCount: 1 },
    ])
    expect(options.gaps).toEqual([{ fromUtc: new Date('2026-09-30T21:00:00.000Z'), toUtcExclusive: new Date('2026-10-01T00:00:00.000Z') }])
    expect(options.gaps.every(gap => gap.fromUtc.getTime() < gap.toUtcExclusive.getTime())).toBe(true)
  })

  it('returns null availability bounds and full-backlog flag for an empty retention', async () => {
    const backlogConfiguration: QueryStoreConfiguration = {
      ...CONFIGURATION,
      readonlyReason: 262144,
      readonlyReasons: ['in_memory_items_awaiting_flush'],
    }
    const { useCase } = createFixture({ intervals: [], configuration: backlogConfiguration })

    const options = (await useCase.execute()).options

    expect(options.selectableSegments).toEqual([])
    expect(options.availability).toEqual({
      oldestIntervalStartUtc: null,
      newestClosedIntervalEndUtc: null,
      openInterval: null,
      inMemoryBacklog: true,
    })
    expect(options.gaps).toEqual([])
  })

  it('flags the in-memory backlog only when the observable bit is set', async () => {
    const backlogConfiguration: QueryStoreConfiguration = {
      ...CONFIGURATION,
      readonlyReason: 65536 | 262144,
      readonlyReasons: ['size_limit_reached', 'in_memory_items_awaiting_flush'],
    }
    const { useCase } = createFixture({ configuration: backlogConfiguration })

    const options = (await useCase.execute()).options

    expect(options.availability.inMemoryBacklog).toBe(true)
    expect(options.queryStoreConfiguration.readonlyReasons).toEqual(['size_limit_reached', 'in_memory_items_awaiting_flush'])
  })

  it('exposes only the bounded public fields through JSON serialization', async () => {
    const intervals = [interval(1, '2026-09-30T23:00:00.000Z', '2026-10-01T00:00:00.000Z')]
    const { useCase } = createFixture({ intervals })

    const snapshot = await useCase.execute()
    const payload = JSON.parse(JSON.stringify(snapshot))

    expect(Object.keys(payload).sort()).toEqual(
      [
        'availability',
        'consistency',
        'gaps',
        'intervalLengthMinutes',
        'observedAtUtc',
        'queryStoreConfiguration',
        'selectableSegments',
      ].sort(),
    )
    const serialized = JSON.stringify(snapshot)
    expect(serialized).not.toContain('runtime_stats_interval_id')
    expect(serialized).not.toContain('"intervals"')
    expect(serialized).not.toContain('#intervalSegments')
  })

  it('cannot expose hidden intervals through own symbols or reflection', async () => {
    const intervals = [interval(1, '2026-09-30T23:00:00.000Z', '2026-10-01T00:00:00.000Z')]
    const { useCase } = createFixture({ intervals })

    const snapshot = await useCase.execute()

    expect(Object.getOwnPropertySymbols(snapshot)).toEqual([])
    expect(Object.getOwnPropertyNames(snapshot)).not.toContain('intervals')
    expect(JSON.stringify(snapshot)).not.toContain('runtime_stats_interval_id')
  })

  it('accepts READ_CAPTURE_SECONDARY and capture NONE for historical discovery', async () => {
    const configuration: QueryStoreConfiguration = {
      ...CONFIGURATION,
      actualState: QueryStoreActualStateList.READ_CAPTURE_SECONDARY,
      desiredState: QueryStoreDesiredStateList.READ_CAPTURE_SECONDARY,
    }
    const { useCase } = createFixture({ configuration })

    await expect(useCase.execute()).resolves.toMatchObject({ options: { queryStoreConfiguration: configuration } })
  })

  it('accepts an unknown actual_state_desc and does not treat it as unavailable', async () => {
    const configuration: QueryStoreConfiguration = { ...CONFIGURATION, actualState: 'NEW_ENGINE_STATE' }
    const { useCase } = createFixture({ configuration })

    const options = (await useCase.execute()).options

    expect(options.queryStoreConfiguration.actualState).toBe('NEW_ENGINE_STATE')
  })

  it('accepts an unknown query_capture_mode_desc', async () => {
    const configuration: QueryStoreConfiguration = { ...CONFIGURATION, queryCaptureMode: 'FUTURE_MODE' }
    const { useCase } = createFixture({ configuration })

    const options = (await useCase.execute()).options

    expect(options.queryStoreConfiguration.queryCaptureMode).toBe('FUTURE_MODE')
  })

  it.each([QueryStoreActualStateList.OFF, QueryStoreActualStateList.ERROR])('owns explicit unavailable state %s', async actualState => {
    const { useCase } = createFixture({ configuration: { ...CONFIGURATION, actualState } })

    await expect(useCase.execute()).rejects.toBeInstanceOf(QueryStoreUnavailableException)
  })

  it('owns the missing-configuration failure', async () => {
    const { useCase } = createFixture({ configuration: null })

    await expect(useCase.execute()).rejects.toMatchObject({ type: 'QueryStoreUnavailableException', errorCode: 6000 })
  })

  it('does not reject overlapping or duplicate interval rows, trusting the engine shape', async () => {
    const intervals = [
      interval(1, '2026-09-30T20:00:00.000Z', '2026-09-30T22:00:00.000Z'),
      interval(2, '2026-09-30T21:00:00.000Z', '2026-09-30T23:00:00.000Z'),
    ]
    const { useCase } = createFixture({ intervals })

    await expect(useCase.execute()).resolves.toBeDefined()
  })

  it('returns defensive public and internal dates from the database timestamp', async () => {
    const intervals = [interval(1, '2026-09-30T23:00:00.000Z', '2026-10-01T00:00:00.000Z')]
    const { useCase } = createFixture({ intervals })

    const snapshot = await useCase.execute()
    intervals[0].startUtc.setUTCFullYear(2031)
    const open = snapshot.options.availability.openInterval
    if (open) open.startUtc.setUTCFullYear(2032)

    expect(snapshot.options.observedAtUtc).toEqual(OBSERVED_AT_UTC)
    expect(snapshot.options.selectableSegments[0].fromUtc).toEqual(new Date('2026-09-30T23:00:00.000Z'))
    expect(snapshot.copyExactIntervalSegments()[0][0].startUtc).toEqual(new Date('2026-09-30T23:00:00.000Z'))
  })
})
