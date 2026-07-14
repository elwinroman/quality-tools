import { ValidTypeSysObject, ValidTypeSysObjectValues } from '@sysobject/domain/schemas/sysobject'
import { z } from 'zod'

export const RegisterFavoritoParamsSchema = z.object({
  schema: z.string(),
  objectName: z.string(),
  type: z
    .string()
    .transform(val => val.toUpperCase())
    .refine(val => ValidTypeSysObjectValues.includes(val as ValidTypeSysObject), {
      message: `Type must be one of: ${ValidTypeSysObjectValues.join(', ')}`,
    }),
})

export type RegisterFavoritoParams = z.infer<typeof RegisterFavoritoParamsSchema>
