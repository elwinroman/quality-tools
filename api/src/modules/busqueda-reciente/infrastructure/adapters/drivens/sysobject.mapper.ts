import { z } from 'zod'

// ── findIDsByNameAndSchema ──────────────────────────────────────────────────

/**
 * `OBJECT_ID(...)` devuelve NULL cuando el objeto no existe en la base. El puerto
 * declara `number[]`, así que ese placeholder se conserva tal cual (deuda conocida).
 */
export const SysObjectIdRowSchema = z.object({
  object_id: z.number().int().nullable(),
})

export type SysObjectIdRow = z.infer<typeof SysObjectIdRowSchema>

export function sysobjectIdRowMapper(row: SysObjectIdRow): number {
  return row.object_id as number
}
