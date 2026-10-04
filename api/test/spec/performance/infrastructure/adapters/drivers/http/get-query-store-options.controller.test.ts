import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { QueryStoreUnavailableException } from '@/modules/performance/application/exceptions/query-store-unavailable.exception'
import { QueryStoreOptionsSnapshot } from '@/modules/performance/application/query-store-options'
import {
  QueryStoreActualStateList,
  QueryStoreCaptureModeList,
  QueryStoreDesiredStateList,
} from '@/modules/performance/domain/query-store-options'
import { GetQueryStoreOptionsController } from '@/modules/performance/infrastructure/adapters/drivers/http/get-query-store-options/get-query-store-options.controller'

const CONFIGURATION = {
  actualState: QueryStoreActualStateList.READ_ONLY,
  desiredState: QueryStoreDesiredStateList.READ_WRITE,
  readonlyReason: 65536,
  readonlyReasons: ['size_limit_reached'],
  intervalLengthMinutes: 60,
  staleQueryThresholdDays: 30,
  queryCaptureMode: QueryStoreCaptureModeList.NONE,
  sizeBasedCleanupMode: 'AUTO',
  waitStatsCaptureMode: 'ON',
  currentStorageSizeMb: 10,
  maxStorageSizeMb: 100,
  flushIntervalSeconds: 900,
}

function buildSnapshot(): QueryStoreOptionsSnapshot {
  return QueryStoreOptionsSnapshot.create(
    {
      observedAtUtc: new Date('2026-10-01T00:00:00.000Z'),
      consistency: 'best_effort',
      queryStoreConfiguration: CONFIGURATION,
      intervalLengthMinutes: 60,
      availability: {
        oldestIntervalStartUtc: new Date('2026-09-30T23:00:00.000Z'),
        newestClosedIntervalEndUtc: new Date('2026-10-01T00:00:00.000Z'),
        openInterval: null,
        inMemoryBacklog: false,
      },
      gaps: [],
    },
    [[{ id: 1, startUtc: new Date('2026-09-30T23:00:00.000Z'), endUtc: new Date('2026-10-01T00:00:00.000Z') }]],
  )
}

function buildResponse() {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))
  return { res: { status } as unknown as Response, status, json }
}

describe('GetQueryStoreOptionsController', () => {
  it('responds 200 with the correlationId envelope and only the public options DTO', async () => {
    const snapshot = buildSnapshot()
    const useCase = { execute: vi.fn(async () => snapshot) }
    const controller = new GetQueryStoreOptionsController(useCase)
    const { res, status, json } = buildResponse()
    const req = { correlationId: 'corr-123' } as unknown as Request
    const next = vi.fn() as unknown as NextFunction

    await controller.run(req, res, next)

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledOnce()
    const payload = json.mock.calls[0][0]
    expect(payload.correlationId).toBe('corr-123')
    expect(payload.data).toMatchObject({
      consistency: 'best_effort',
      intervalLengthMinutes: 60,
      selectableSegments: [
        {
          fromUtc: new Date('2026-09-30T23:00:00.000Z'),
          toUtcExclusive: new Date('2026-10-01T00:00:00.000Z'),
          intervalCount: 1,
        },
      ],
      availability: {
        oldestIntervalStartUtc: new Date('2026-09-30T23:00:00.000Z'),
        newestClosedIntervalEndUtc: new Date('2026-10-01T00:00:00.000Z'),
        openInterval: null,
        inMemoryBacklog: false,
      },
      gaps: [],
    })
    expect(Object.getOwnPropertySymbols(payload.data)).toEqual([])

    const serialized = JSON.stringify(payload)
    expect(serialized).not.toContain('intervals"')
    expect(serialized).not.toContain('runtime_stats_interval_id')
    expect(serialized).not.toContain('#intervalSegments')
    expect(next).not.toHaveBeenCalled()
  })

  it('propagates application errors to next without responding', async () => {
    const error = new QueryStoreUnavailableException(QueryStoreActualStateList.OFF)
    const useCase = {
      execute: vi.fn(async () => {
        throw error
      }),
    }
    const controller = new GetQueryStoreOptionsController(useCase)
    const { res, status, json } = buildResponse()
    const req = { correlationId: 'corr-err' } as unknown as Request
    const next = vi.fn() as unknown as NextFunction

    await controller.run(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
    expect(status).not.toHaveBeenCalled()
    expect(json).not.toHaveBeenCalled()
  })
})
