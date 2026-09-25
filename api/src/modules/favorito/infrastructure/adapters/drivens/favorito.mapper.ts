import { FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
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
 */

// ── createOrUpdate ──────────────────────────────────────────────────────────

export const FavoritoRowSchema = z.object({
  idFavorito: z.number().int(),
  cSchema: z.string(),
  cNombreObjeto: z.string(),
  // cType es CHAR(2) en la base, así que vuelve con relleno ('V ').
  cType: z.string().trim(),
  dFecha: z.date(),
  lVigente: z.boolean(),
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
  }
}

// ── findMany ────────────────────────────────────────────────────────────────

/** Igual que `FavoritoRowSchema` más el total de registros de la consulta. */
export const FavoritoListRowSchema = FavoritoRowSchema.extend({
  nTotal: z.number().int(),
})

export type FavoritoListRow = z.infer<typeof FavoritoListRowSchema>

// ── Lectura del recordset ───────────────────────────────────────────────────

/**
 * Decodifica una fila única.
 *
 * `null` significa "la consulta no devolvió filas", que es un resultado legítimo:
 * desactivar un favorito que no existía. Una fila que existe pero no coincide con
 * el schema es un bug, así que lanza en vez de devolver un valor con campos vacíos.
 */
export function decodeRow<TRow>(rows: unknown[] | undefined, schema: z.ZodType<TRow>): TRow | null {
  const [row] = rows ?? []

  return row === undefined ? null : schema.parse(row)
}

/** Decodifica una lista completa, validando cada fila. */
export function decodeRows<TRow>(rows: unknown[] | undefined, schema: z.ZodType<TRow>): TRow[] {
  return (rows ?? []).map(row => schema.parse(row))
}
