import { Favorito, FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
import { z } from 'zod'

/**
 * Mappers de las filas que devuelve SQL hacia los tipos del puerto.
 *
 * Cada proyección sigue el mismo patrón, y agregar una consulta nueva es agregar
 * estos tres elementos:
 *
 *   1. `<nombre>RowSchema` — valida la forma que devuelve la consulta.
 *   2. `<nombre>Row`       — el tipo, inferido del schema (no se escribe a mano).
 *   3. `<nombre>Mapper`    — traduce esa fila al tipo del puerto.
 *
 * Hablan el vocabulario de la base (`cSchema`, `lVigente`), nunca el del dominio.
 * Es el único punto que conoce los dos, así que si el puerto cambia esto no compila.
 *
 * Las consultas proyectan también el alcance (`FavoriteScopeId`, `ServerName`,
 * `DatabaseName`) desde `dbo.FavoriteScope`; el mapper lo traduce a `scope`.
 */

// ── columnas de alcance compartidas ─────────────────────────────────────────

const scopeColumns = {
  FavoriteScopeId: z.number().int(),
  ServerName: z.string().nullable(),
  DatabaseName: z.string().nullable(),
}

// ── createOrUpdate ──────────────────────────────────────────────────────────

export const FavoritoRowSchema = z.object({
  idFavorito: z.number().int(),
  cSchema: z.string(),
  cNombreObjeto: z.string(),
  // cType es CHAR(2) en la base, así que vuelve con relleno ('V ').
  cType: z.string().trim(),
  dFecha: z.date(),
  lVigente: z.boolean(),
  ...scopeColumns,
})

export type FavoritoRow = z.infer<typeof FavoritoRowSchema>

export function favoritoRowMapper(row: FavoritoRow): FavoritoRepoResponse {
  return {
    id: row.idFavorito,
    schema: row.cSchema,
    objectName: row.cNombreObjeto,
    type: row.cType,
    date: row.dFecha,
    isActive: row.lVigente,
    scope: { serverName: row.ServerName, databaseName: row.DatabaseName },
  }
}

// ── findMany ────────────────────────────────────────────────────────────────

export const FavoritoListRowSchema = FavoritoRowSchema.extend({
  nTotal: z.number().int(),
})

export type FavoritoListRow = z.infer<typeof FavoritoListRowSchema>

// ── getById ─────────────────────────────────────────────────────────────────

/**
 * `FavoritoRowSchema` no alcanza para la fila de `getById`: la consulta proyecta
 * `idUsuario` y el tipo del puerto (`Favorito`) incluye el usuario. createOrUpdate
 * y findMany no lo devuelven, por eso se extiende el schema base en vez de
 * modificarlo.
 */
export const FavoritoEntityRowSchema = FavoritoRowSchema.extend({
  idUsuario: z.number().int(),
})

export type FavoritoEntityRow = z.infer<typeof FavoritoEntityRowSchema>

export function favoritoEntityRowMapper(row: FavoritoEntityRow): Favorito {
  return {
    id: row.idFavorito,
    idUser: row.idUsuario,
    schema: row.cSchema,
    objectName: row.cNombreObjeto,
    type: row.cType,
    date: row.dFecha,
    isActive: row.lVigente,
    scope: { serverName: row.ServerName, databaseName: row.DatabaseName },
  }
}
