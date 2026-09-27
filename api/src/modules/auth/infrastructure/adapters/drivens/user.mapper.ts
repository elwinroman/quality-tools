import { PersistedUser, User } from '@auth/domain/schemas/user'
import { z } from 'zod'

// ── getOrCreate y getById ───────────────────────────────────────────────────

/**
 * El MERGE con `OUTPUT INSERTED` y el `SELECT` de la entidad devuelven la misma
 * proyección de columnas, así que comparten schema y mapper.
 */
export const UserRowSchema = z.object({
  idUsuario: z.number().int(),
  cHashUsuarioUID: z.string(),
  cUsuario: z.string(),
  cServer: z.string(),
  cAliasServer: z.string(),
  dFechaRegistro: z.date(),
  lVigente: z.boolean(),
})

export type UserRow = z.infer<typeof UserRowSchema>

/**
 * Reusa el factory `User.persisted(...)` en vez de repetir el hash, el lowercasing y
 * los defaults de rol/estado: reproducir esa lógica acá sería duplicar el dominio.
 */
export function userRowMapper(row: UserRow): PersistedUser {
  return User.persisted({
    id: row.idUsuario,
    hashId: row.cHashUsuarioUID,
    user: row.cUsuario,
    host: row.cServer,
    aliasHost: row.cAliasServer,
    createdAt: row.dFechaRegistro,
    isActive: row.lVigente,
  })
}
