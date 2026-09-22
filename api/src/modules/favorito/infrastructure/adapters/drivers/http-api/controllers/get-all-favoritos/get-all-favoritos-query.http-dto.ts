import { strictIntegerSchema } from '@shared/infrastructure/schemas/strict-integer'
import { TypeSysObject, TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { z } from 'zod'

export const GetAllFavoritosQuerySchema = z.object({
  type: z
    .string()
    .transform(val => val.toUpperCase())
    .refine(val => Object.values(TypeSysObjectEnum).includes(val as TypeSysObject), {
      message: `Type must be one of: ${Object.values(TypeSysObjectEnum).join(', ')}`,
    }),
  limit: strictIntegerSchema.pipe(z.number().int().min(1).max(100)),
})

export type GetAllFavoritosQuery = z.infer<typeof GetAllFavoritosQuerySchema>
