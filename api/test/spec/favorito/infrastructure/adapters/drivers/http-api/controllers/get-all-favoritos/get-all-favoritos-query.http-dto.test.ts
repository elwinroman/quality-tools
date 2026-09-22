import { GetAllFavoritosQuerySchema } from '@favorito/infrastructure/adapters/drivers/http-api/controllers/get-all-favoritos/get-all-favoritos-query.http-dto'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

describe('GetAllFavoritosQuerySchema', () => {
  describe('normalización de type', () => {
    it('debería convertir el tipo a mayúsculas antes de validarlo', () => {
      const tipo = TypeSysObjectEnum.SQL_SCALAR_FUNCTION

      expect(GetAllFavoritosQuerySchema.parse({ type: tipo.toLowerCase(), limit: 5 })).toEqual({ type: tipo, limit: 5 })
    })

    it('debería aceptar los tipos agregados', () => {
      const agregados = [TypeSysObjectEnum.ALL, TypeSysObjectEnum.ALL_EXCEPT_USERTABLE]

      agregados.forEach(agregado => {
        expect(GetAllFavoritosQuerySchema.parse({ type: agregado.toLowerCase(), limit: 5 }).type).toBe(agregado)
      })
    })
  })

  describe('rechazo de type', () => {
    it('debería rechazar un tipo que no sea un código del enum', () => {
      const resultado = GetAllFavoritosQuerySchema.safeParse({ type: 'VIEW', limit: 5 })

      expect(resultado.success).toBe(false)
    })

    it('debería rechazar un tipo que no sea texto', () => {
      const resultado = GetAllFavoritosQuerySchema.safeParse({ type: 123, limit: 5 })

      expect(resultado.success).toBe(false)
    })
  })

  describe('limit', () => {
    it('debería convertir un limit de texto a número', () => {
      expect(GetAllFavoritosQuerySchema.parse({ type: TypeSysObjectEnum.VIEW, limit: '10' })).toEqual({
        type: TypeSysObjectEnum.VIEW,
        limit: 10,
      })
    })

    it('debería aceptar los bordes 1 y 100', () => {
      expect(GetAllFavoritosQuerySchema.parse({ type: TypeSysObjectEnum.VIEW, limit: 1 }).limit).toBe(1)
      expect(GetAllFavoritosQuerySchema.parse({ type: TypeSysObjectEnum.VIEW, limit: 100 }).limit).toBe(100)
    })

    it('debería rechazar valores fuera del rango permitido', () => {
      expect(GetAllFavoritosQuerySchema.safeParse({ type: TypeSysObjectEnum.VIEW, limit: 0 }).success).toBe(false)
      expect(GetAllFavoritosQuerySchema.safeParse({ type: TypeSysObjectEnum.VIEW, limit: 101 }).success).toBe(false)
    })

    it('debería rechazar un limit no entero o no numérico', () => {
      expect(GetAllFavoritosQuerySchema.safeParse({ type: TypeSysObjectEnum.VIEW, limit: '2.5' }).success).toBe(false)
      expect(GetAllFavoritosQuerySchema.safeParse({ type: TypeSysObjectEnum.VIEW, limit: 'abc' }).success).toBe(false)
    })
  })
})
