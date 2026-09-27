import { z } from 'zod'

/**
 * Lectura de recordsets: valida cada fila contra su schema antes de que llegue al mapper.
 *
 * `decodeRow` devuelve `null` cuando la consulta no trajo filas, que es un resultado
 * legítimo: por ejemplo desactivar algo que no existía. Una fila que existe pero no
 * coincide con el schema es un bug, así que lanza en vez de devolver campos vacíos.
 */

export function decodeRow<TRow>(rows: unknown[] | undefined, schema: z.ZodType<TRow>): TRow | null {
  const [row] = rows ?? []

  return row === undefined ? null : schema.parse(row)
}

export function decodeRows<TRow>(rows: unknown[] | undefined, schema: z.ZodType<TRow>): TRow[] {
  return (rows ?? []).map(row => schema.parse(row))
}
