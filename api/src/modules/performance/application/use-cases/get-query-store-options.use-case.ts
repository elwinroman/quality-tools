import { QueryStoreUnavailableException } from '@/modules/performance/application/exceptions/query-store-unavailable.exception'
import type { QueryStoreAvailability } from '@/modules/performance/application/query-store-options'
import { QueryStoreOptionsSnapshot } from '@/modules/performance/application/query-store-options'
import type { ForQueryStoreOptionsRepositoryPort } from '@/modules/performance/domain/ports/drivens/for-query-store-options-repository.port'
import type { QueryStoreRuntimeInterval, UtcRange } from '@/modules/performance/domain/query-store-options'
import { QueryStoreActualStateList, READONLY_REASON_IN_MEMORY_BACKLOG } from '@/modules/performance/domain/query-store-options'

interface DerivedAvailability {
  availability: QueryStoreAvailability
  gaps: UtcRange[]
}

export class GetQueryStoreOptionsUseCase {
  constructor(private readonly queryStoreContextRepository: ForQueryStoreOptionsRepositoryPort) {}

  async execute(): Promise<QueryStoreOptionsSnapshot> {
    const context = await this.queryStoreContextRepository.findOptionsContext()
    const configuration = context.configuration

    if (!configuration) throw new QueryStoreUnavailableException('missing_configuration')

    // Sólo OFF/ERROR exactos bloquea
    if (configuration.actualState === QueryStoreActualStateList.OFF || configuration.actualState === QueryStoreActualStateList.ERROR)
      throw new QueryStoreUnavailableException(configuration.actualState)

    // Instante autoritativo de la base: una sola evaluación, reutilizada para clasificar intervalos.
    const observedAtTime = context.observedAtUtc.getTime()
    const intervals = this.sortIntervals(context.retainedIntervals)
    const closedIntervals = intervals.filter(interval => interval.endUtc.getTime() <= observedAtTime)
    const openIntervals = intervals.filter(interval => interval.endUtc.getTime() > observedAtTime)

    // La selección de reporte sólo usa intervalos cerrados y contiguos, el abierto nunca es seleccionable.
    const closedSegments = this.buildSegments(closedIntervals)
    const derived = this.deriveAvailability(intervals, closedIntervals, openIntervals, configuration.readonlyReason)

    return QueryStoreOptionsSnapshot.create(
      {
        observedAtUtc: new Date(observedAtTime),
        consistency: 'best_effort',
        queryStoreConfiguration: configuration,
        intervalLengthMinutes: configuration.intervalLengthMinutes,
        availability: derived.availability,
        gaps: derived.gaps,
      },
      closedSegments,
    )
  }

  private sortIntervals(intervals: QueryStoreRuntimeInterval[]): QueryStoreRuntimeInterval[] {
    return intervals
      .map(interval => ({
        id: interval.id,
        startUtc: new Date(interval.startUtc.getTime()),
        endUtc: new Date(interval.endUtc.getTime()),
      }))
      .sort(
        (left, right) =>
          left.startUtc.getTime() - right.startUtc.getTime() || left.endUtc.getTime() - right.endUtc.getTime() || left.id - right.id,
      )
  }

  private deriveAvailability(
    intervals: QueryStoreRuntimeInterval[],
    closedIntervals: QueryStoreRuntimeInterval[],
    openIntervals: QueryStoreRuntimeInterval[],
    readonlyReason: number,
  ): DerivedAvailability {
    const oldest = intervals[0] ?? null
    const newestClosed = closedIntervals[closedIntervals.length - 1] ?? null
    const open = openIntervals[0] ?? null

    const availability: QueryStoreAvailability = {
      oldestIntervalStartUtc: oldest ? new Date(oldest.startUtc.getTime()) : null,
      newestClosedIntervalEndUtc: newestClosed ? new Date(newestClosed.endUtc.getTime()) : null,
      openInterval: open ? { startUtc: new Date(open.startUtc.getTime()), expectedEndUtc: new Date(open.endUtc.getTime()) } : null,
      inMemoryBacklog: (readonlyReason & READONLY_REASON_IN_MEMORY_BACKLOG) !== 0,
    }

    const gaps: UtcRange[] = []
    for (let index = 1; index < intervals.length; index += 1) {
      const previous = intervals[index - 1]
      const current = intervals[index]
      const previousEnd = previous.endUtc.getTime()
      const currentStart = current.startUtc.getTime()

      if (previousEnd < currentStart) {
        gaps.push({ fromUtc: new Date(previousEnd), toUtcExclusive: new Date(currentStart) })
      }
    }

    return { availability, gaps }
  }

  private buildSegments(intervals: QueryStoreRuntimeInterval[]): QueryStoreRuntimeInterval[][] {
    const segments: QueryStoreRuntimeInterval[][] = []

    for (const current of intervals) {
      const segment = segments[segments.length - 1]
      const previous = segment?.[segment.length - 1]
      if (!previous || current.startUtc.getTime() > previous.endUtc.getTime()) segments.push([current])
      else segment.push(current)
    }

    return segments.map(intervalList =>
      intervalList.map(interval => ({
        id: interval.id,
        startUtc: new Date(interval.startUtc.getTime()),
        endUtc: new Date(interval.endUtc.getTime()),
      })),
    )
  }
}
