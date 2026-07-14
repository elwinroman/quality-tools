import { z } from 'zod'

export const GetSysObjectQuerySchema = z.object({
  schema: z.string().trim().min(1),
  name: z.string().trim().min(1),
})

export type GetSysObjectHttpDto = z.infer<typeof GetSysObjectQuerySchema>
