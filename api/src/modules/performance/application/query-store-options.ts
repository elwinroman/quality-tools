import type { QueryStoreConfiguration, QueryStoreRuntimeInterval, UtcRange } from '@/modules/performance/domain/query-store-options'

/** Tramo contiguo y ordenado de intervalos cerrados; es lo único seleccionable para un reporte. */
export interface QueryStoreSelectableSegment {
  fromUtc: Date
  toUtcExclusive: Date
  intervalCount: number
}

/** Intervalo aún abierto: su `expectedEndUtc` es el fin nominal reportado, no un cierre confirmado. */
export interface QueryStoreOpenInterval {
  startUtc: Date
  expectedEndUtc: Date
}

/**
 * Disponibilidad real derivada de los intervalos retenidos.
 * `oldestIntervalStartUtc` y `newestClosedIntervalEndUtc` son `null` cuando no existen filas.
 */
export interface QueryStoreAvailability {
  oldestIntervalStartUtc: Date | null
  newestClosedIntervalEndUtc: Date | null
  openInterval: QueryStoreOpenInterval | null

  /** Sólo se marca con el bit observable de `readonly_reason`; no implica pérdida de datos históricos. */
  inMemoryBacklog: boolean
}

/**
 * DTO público de opciones de Query Store para un futuro filtro de UI.
 * Expone únicamente señales observables; los intervalos exactos quedan en el snapshot privado.
 */
export interface QueryStoreOptions {
  observedAtUtc: Date
  consistency: 'best_effort'
  queryStoreConfiguration: QueryStoreConfiguration
  intervalLengthMinutes: number
  availability: QueryStoreAvailability

  /** Huecos estrictamente entre dos intervalos retenidos consecutivos; nunca antes del primero ni después del último. */
  gaps: UtcRange[]

  selectableSegments: QueryStoreSelectableSegment[]
}

interface SnapshotInput {
  observedAtUtc: Date
  consistency: 'best_effort'
  queryStoreConfiguration: QueryStoreConfiguration
  intervalLengthMinutes: number
  availability: QueryStoreAvailability
  gaps: UtcRange[]
}

/**
 * Snapshot opaco: JSON sólo ve `options`; los intervalos exactos permanecen en campos privados y no son serializables.
 */
export class QueryStoreOptionsSnapshot {
  #input: SnapshotInput
  #intervalSegments: QueryStoreRuntimeInterval[][]

  private constructor(input: SnapshotInput, intervalSegments: readonly (readonly QueryStoreRuntimeInterval[])[]) {
    this.#input = {
      ...input,
      observedAtUtc: new Date(input.observedAtUtc.getTime()),
      queryStoreConfiguration: {
        ...input.queryStoreConfiguration,
        readonlyReasons: [...input.queryStoreConfiguration.readonlyReasons],
      },
      availability: QueryStoreOptionsSnapshot.copyAvailability(input.availability),
      gaps: input.gaps.map(range => QueryStoreOptionsSnapshot.copyRange(range)),
    }
    this.#intervalSegments = QueryStoreOptionsSnapshot.copySegments(intervalSegments)
  }

  static create(input: SnapshotInput, intervalSegments: readonly (readonly QueryStoreRuntimeInterval[])[]): QueryStoreOptionsSnapshot {
    return new QueryStoreOptionsSnapshot(input, intervalSegments)
  }

  static isTrusted(value: unknown): value is QueryStoreOptionsSnapshot {
    if (!(value instanceof QueryStoreOptionsSnapshot)) return false
    try {
      // Tocar el campo privado fuerza la marca de clase: un `Object.create(prototype)` no puede aportar intervalos.
      return Array.isArray(value.#intervalSegments)
    } catch {
      return false
    }
  }

  get options(): QueryStoreOptions {
    return {
      observedAtUtc: new Date(this.#input.observedAtUtc.getTime()),
      consistency: this.#input.consistency,
      queryStoreConfiguration: {
        ...this.#input.queryStoreConfiguration,
        readonlyReasons: [...this.#input.queryStoreConfiguration.readonlyReasons],
      },
      intervalLengthMinutes: this.#input.intervalLengthMinutes,
      availability: QueryStoreOptionsSnapshot.copyAvailability(this.#input.availability),
      gaps: this.#input.gaps.map(range => QueryStoreOptionsSnapshot.copyRange(range)),
      selectableSegments: this.#intervalSegments.map(intervals => ({
        fromUtc: new Date(intervals[0].startUtc.getTime()),
        toUtcExclusive: new Date(intervals[intervals.length - 1].endUtc.getTime()),
        intervalCount: intervals.length,
      })),
    }
  }

  toJSON(): QueryStoreOptions {
    return this.options
  }

  copyExactIntervalSegments(): QueryStoreRuntimeInterval[][] {
    return QueryStoreOptionsSnapshot.copySegments(this.#intervalSegments)
  }

  private static copyRange(range: UtcRange): UtcRange {
    return { fromUtc: new Date(range.fromUtc.getTime()), toUtcExclusive: new Date(range.toUtcExclusive.getTime()) }
  }

  private static copyAvailability(availability: QueryStoreAvailability): QueryStoreAvailability {
    return {
      oldestIntervalStartUtc: availability.oldestIntervalStartUtc ? new Date(availability.oldestIntervalStartUtc.getTime()) : null,
      newestClosedIntervalEndUtc: availability.newestClosedIntervalEndUtc
        ? new Date(availability.newestClosedIntervalEndUtc.getTime())
        : null,
      openInterval: availability.openInterval
        ? {
            startUtc: new Date(availability.openInterval.startUtc.getTime()),
            expectedEndUtc: new Date(availability.openInterval.expectedEndUtc.getTime()),
          }
        : null,
      inMemoryBacklog: availability.inMemoryBacklog,
    }
  }

  private static copySegments(intervalSegments: readonly (readonly QueryStoreRuntimeInterval[])[]): QueryStoreRuntimeInterval[][] {
    return intervalSegments.map(intervals =>
      intervals.map(interval => ({
        id: interval.id,
        startUtc: new Date(interval.startUtc.getTime()),
        endUtc: new Date(interval.endUtc.getTime()),
      })),
    )
  }
}
