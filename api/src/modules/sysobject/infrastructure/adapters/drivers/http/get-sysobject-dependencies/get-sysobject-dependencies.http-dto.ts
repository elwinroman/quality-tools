import { z } from 'zod'

export const GetSysObjectDependenciesQuerySchema = z.object({
  name: z.string().trim().min(1),
  schema: z.string().trim().min(1),
})

export type GetSysObjectDependenciesHttpDto = z.infer<typeof GetSysObjectDependenciesQuerySchema>
