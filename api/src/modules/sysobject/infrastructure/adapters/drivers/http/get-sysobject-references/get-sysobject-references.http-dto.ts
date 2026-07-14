import { z } from 'zod'

export const GetSysObjectReferencesQuerySchema = z.object({
  name: z.string().trim().min(1),
  schema: z.string().trim().min(1),
})

export type GetSysObjectReferencesHttpDto = z.infer<typeof GetSysObjectReferencesQuerySchema>
