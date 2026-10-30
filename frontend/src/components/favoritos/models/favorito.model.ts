import type { BaseSysObjectType } from '@/models/sysobject'

/** Alcance de un favorito: global (todas las bases), por servidor o por base puntual. */
export type FavoriteScopeKind = 'global' | 'server' | 'database'

/** Etiquetas visibles de cada alcance, compartidas por el control segmentado y los toasts. */
export const FAVORITE_SCOPE_LABELS = {
  global: 'Global',
  database: 'BD actual',
  server: 'Este servidor',
} as const

/** Identidad del alcance. `serverName`/`databaseName` nulos representan el alcance global. */
export interface FavoriteScope {
  serverName: string | null
  databaseName: string | null
}

export interface Favorito {
  id: number
  schema: string
  objectName: string
  type: BaseSysObjectType
  date: string | Date
  objectId: number | null
  scope: FavoriteScope
}

/** Item crudo de la API: `scope` puede faltar en respuestas de versiones previas. */
export type FavoritoApiItem = Omit<Favorito, 'scope'> & { scope?: FavoriteScope }

export interface FavoritoApiResponse {
  correlationId: string
  meta: { total: number }
  data: FavoritoApiItem[]
}

export interface UpsertFavoritoBody {
  schema: string
  objectName: string
  type: string
  /** true lo marca como favorito; false lo quita. El backend lo exige. */
  isActive: boolean
  /** Alcance del favorito. Ausente = global (comportamiento previo). */
  scope?: FavoriteScopeKind
}

/**
 * Resultado de la escritura. El front solo consume `isActive` para elegir el mensaje;
 * `data: null` significa que no se escribió nada (ya estaba en el estado pedido).
 */
export interface FavoritoWriteResult {
  isActive: boolean
}

export interface UpsertFavoritoResponse {
  correlationId: string
  message: string
  data: FavoritoWriteResult | null
}

/** Deriva el tipo de alcance a partir de sus nombres. */
export const scopeKindFrom = (scope: FavoriteScope): FavoriteScopeKind => {
  if (scope.serverName === null) return 'global'
  if (scope.databaseName === null) return 'server'
  return 'database'
}

const SCOPE_RANK: Record<FavoriteScopeKind, number> = { global: 0, server: 1, database: 2 }

/** Jerarquía de especificidad: global (0) < server (1) < database (2). */
export const scopeRank = (scope: FavoriteScope): number => SCOPE_RANK[scopeKindFrom(scope)]
