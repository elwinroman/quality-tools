import { FAVORITE_SCOPE_KIND, type FavoriteScopeKind } from '@favorito/domain/schemas/favorito'
import { ValidTypeSysObject, ValidTypeSysObjectValues } from '@sysobject/domain/schemas/sysobject'
import { z } from 'zod'

/** Valores validos del alcance, derivados del dominio para no duplicar la lista. */
const FAVORITE_SCOPE_VALUES = Object.values(FAVORITE_SCOPE_KIND) as [FavoriteScopeKind, ...FavoriteScopeKind[]]

export const RegisterFavoritoParamsSchema = z.object({
  schema: z.string().trim().min(1),
  objectName: z.string().trim().min(1),
  type: z
    .string()
    .transform(val => val.toUpperCase())
    .refine(val => ValidTypeSysObjectValues.includes(val as ValidTypeSysObject), {
      message: `Type must be one of: ${ValidTypeSysObjectValues.join(', ')}`,
    }),
  isActive: z.boolean(),
  scope: z
    .string()
    .transform(val => val.toLowerCase())
    .pipe(z.enum(FAVORITE_SCOPE_VALUES))
    .default(FAVORITE_SCOPE_KIND.global),
})

export type RegisterFavoritoParams = z.infer<typeof RegisterFavoritoParamsSchema>
