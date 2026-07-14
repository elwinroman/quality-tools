import { z } from 'zod'

export const GetSysUsertableQuerySchema = z.object({
  schema: z.string().trim().min(1),
  name: z.string().trim().min(1),
})

export type GetSysUsertableHttpDto = z.infer<typeof GetSysUsertableQuerySchema>
