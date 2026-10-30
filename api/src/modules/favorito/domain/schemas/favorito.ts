import { TypeSysObject } from '@sysobject/domain/schemas/sysobject'

/**
 * Alcance de un favorito.
 *
 * Es un prefijo de `(servidor, base)`: ambos en `null` = global, solo `serverName` = todo el
 * servidor, y ambos presentes = una base puntual. `serverName` es el nombre de instancia
 * (`@@SERVERNAME`), no el alias que tipea el usuario.
 */
export interface FavoriteScope {
  /** Nombre de la instancia SQL (`@@SERVERNAME`); `null` = aplica a todos los servidores */
  serverName: string | null

  /** Nombre de la base; `null` con `serverName` presente = aplica a todas las bases del servidor */
  databaseName: string | null
}

/** Tipos de alcance que el cliente puede pedir al registrar un favorito. */
export const FAVORITE_SCOPE_KIND = {
  global: 'global',
  server: 'server',
  database: 'database',
} as const

export type FavoriteScopeKind = (typeof FAVORITE_SCOPE_KIND)[keyof typeof FAVORITE_SCOPE_KIND]

/** Id reservado del alcance global (ambos nombres en `null`) en `dbo.FavoriteScope`. */
export const GLOBAL_FAVORITE_SCOPE_ID = 0

/** Contexto `(servidor, base)` desde el que se opera; lo resuelve el servidor, no el cliente. */
export interface FavoriteScopeContext {
  serverName: string
  databaseName: string
}

/**
 * Resuelve el alcance concreto de un favorito a partir del tipo pedido y el contexto actual.
 * Es pura: no toca persistencia ni infraestructura.
 */
export function resolveFavoriteScope(kind: FavoriteScopeKind, context: FavoriteScopeContext): FavoriteScope {
  if (kind === FAVORITE_SCOPE_KIND.global) return { serverName: null, databaseName: null }
  if (kind === FAVORITE_SCOPE_KIND.server) return { serverName: context.serverName, databaseName: null }

  return { serverName: context.serverName, databaseName: context.databaseName }
}

/**
 * Representa un objeto marcado como favorito por un usuario dentro del sistema.
 */
export interface Favorito {
  /** Identificador único del favorito */
  id: number

  /** Identificador del usuario que marcó el objeto como favorito */
  idUser: number

  /** Nombre del esquema dentro de la base de datos */
  schema: string

  /** Nombre del objeto referenciado */
  objectName: string

  /** Tipo del objeto (por ejemplo: 'T' para tabla, 'V' para vista, etc.) */
  type: string

  /** Fecha y hora en que se marcó como favorito o se accedió por última vez */
  date: Date | string

  /**
   * Indica si el favorito está activo.
   * Se utiliza para ocultar o restaurar favoritos sin eliminarlos permanentemente.
   */
  isActive: boolean

  /** Alcance del favorito (global, por servidor o por base) */
  scope: FavoriteScope
}

/**
 * Datos requeridos para registrar un nuevo favorito.
 * Excluye el identificador interno `id`, `date` y el `scope` concreto: el cliente manda un
 * `FavoriteScopeKind` y el caso de uso resuelve el alcance.
 */
export type FavoritoInput = Omit<Favorito, 'id' | 'date' | 'scope'>

export type FavoritoRepoInput = Omit<Favorito, 'id'>

/**
 * Criterios de filtrado para recuperar favoritos desde la capa de aplicación.
 */
export type FavoritoFilter = Pick<Favorito, 'idUser'> & {
  /** Tipo de objeto a filtrar */
  type: TypeSysObject

  /** Contexto `(servidor, base)` desde el cual se consultan los favoritos */
  context: FavoriteScopeContext
}

/**
 * Filtro de recuperación utilizado a nivel de repositorio,
 * incluyendo usuario, tipo de objeto y el contexto de alcance.
 */
export type FavoritoFilterRepo = Pick<Favorito, 'idUser' | 'type'> & {
  /** Contexto `(servidor, base)` desde el cual se consultan los favoritos */
  context: FavoriteScopeContext
}

/**
 * Representa una entrada de favorito devuelta por el repositorio
 */
export type FavoritoRepoResponse = Pick<Favorito, 'id' | 'schema' | 'objectName' | 'date' | 'type' | 'isActive' | 'scope'>

/**
 * Respuesta extendida para recuperación de favoritos,
 * incluyendo el identificador del objeto referenciado.
 */
export type FavoritoResponse = FavoritoRepoResponse & {
  /** Identificador del objeto; `null` cuando el objeto referenciado ya no existe en la base */
  objectId: number | null
}
