import { strictIntegerSchema } from '@shared/infrastructure/schemas/strict-integer'
import { z } from 'zod'

export const DeleteFavoritoParamsSchema = z.object({
  id: strictIntegerSchema.pipe(z.number().int().positive()),
})

export type DeleteFavoritoParams = z.infer<typeof DeleteFavoritoParamsSchema>
