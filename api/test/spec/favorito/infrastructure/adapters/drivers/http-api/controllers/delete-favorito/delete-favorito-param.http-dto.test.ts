import { DeleteFavoritoParamsSchema } from '@favorito/infrastructure/adapters/drivers/http-api/controllers/delete-favorito/delete-favorito-param.http-dto'
import { describe, expect, it } from 'vitest'

describe('DeleteFavoritoParamsSchema', () => {
  describe('coerción de id', () => {
    it('debería convertir un id de texto a número', () => {
      expect(DeleteFavoritoParamsSchema.parse({ id: '7' })).toEqual({ id: 7 })
    })

    it('debería aceptar el borde positivo mínimo', () => {
      expect(DeleteFavoritoParamsSchema.parse({ id: 1 })).toEqual({ id: 1 })
    })
  })

  describe('rechazo de id', () => {
    it('debería rechazar valores no positivos', () => {
      expect(DeleteFavoritoParamsSchema.safeParse({ id: 0 }).success).toBe(false)
      expect(DeleteFavoritoParamsSchema.safeParse({ id: '-3' }).success).toBe(false)
    })

    it('debería rechazar valores no enteros o no numéricos', () => {
      expect(DeleteFavoritoParamsSchema.safeParse({ id: 1.5 }).success).toBe(false)
      expect(DeleteFavoritoParamsSchema.safeParse({ id: 'abc' }).success).toBe(false)
    })
  })
})
