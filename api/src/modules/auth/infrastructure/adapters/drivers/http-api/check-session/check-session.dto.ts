import { z } from 'zod'

/**
 * Payload de `GET /api/v1/auth/check-session`.
 *
 * `database` es la base de datos activa de la sesión resuelta por el servidor.
 * Exponerla permite que el cliente no mantenga una copia propia que pueda
 * quedar obsoleta cuando la sesión cambia de base de datos en otra pestaña.
 */
export const CheckSessionDataSchema = z.object({
  databaseConnection: z.string(),
  viewdefinitionPermission: z.boolean(),
  checkedAt: z.string(),
  database: z.string(),
})

export type CheckSessionDataHttpDto = z.infer<typeof CheckSessionDataSchema>
