import { z } from 'zod'

// ── findIDsByNameAndSchema ──────────────────────────────────────────────────

/**
 * `OBJECT_ID(...)` devuelve NULL cuando el objeto ya no existe en la base: es un dato
 * de negocio legítimo, no un error. El mapper conserva ese NULL y el tipo lo declara
 * para que el resto de la cadena no tenga que mentir con un cast.
 */
export const SysObjectIdRowSchema = z.object({
  object_id: z.number().int().nullable(),
})

export type SysObjectIdRow = z.infer<typeof SysObjectIdRowSchema>

export function sysobjectIdRowMapper(row: SysObjectIdRow): number | null {
  return row.object_id
}
