import { RegisterFavoritoParamsSchema } from '@favorito/infrastructure/adapters/drivers/http-api/controllers/register-favorito/register-favorito-params.http-dto'
import { TypeSysObjectEnum } from '@sysobject/domain/schemas/sysobject'
import { describe, expect, it } from 'vitest'

describe('RegisterFavoritoParamsSchema', () => {
  describe('normalización de type', () => {
    it('debería convertir el tipo a mayúsculas y conservar schema y objectName', () => {
      const tipo = TypeSysObjectEnum.SQL_SCALAR_FUNCTION

      expect(
        RegisterFavoritoParamsSchema.parse({
          schema: 'dbo',
          objectName: 'fn_total',
          type: tipo.toLowerCase(),
        }),
      ).toEqual({ schema: 'dbo', objectName: 'fn_total', type: tipo })
    })
  })

  describe('tipos agregados', () => {
    it('debería rechazar los tipos agregados ALL y ALL_EXCEPT_USERTABLE', () => {
      const agregados = [TypeSysObjectEnum.ALL, TypeSysObjectEnum.ALL_EXCEPT_USERTABLE]

      agregados.forEach(agregado => {
        const resultado = RegisterFavoritoParamsSchema.safeParse({
          schema: 'dbo',
          objectName: 'fn_total',
          type: agregado,
        })

        expect(resultado.success).toBe(false)
      })
    })
  })

  describe('rechazo de type', () => {
    it('debería rechazar un tipo que no sea un código del enum', () => {
      const resultado = RegisterFavoritoParamsSchema.safeParse({
        schema: 'dbo',
        objectName: 'fn_total',
        type: 'VIEW',
      })

      expect(resultado.success).toBe(false)
    })

    it('debería rechazar un type que no sea texto', () => {
      const resultado = RegisterFavoritoParamsSchema.safeParse({
        schema: 'dbo',
        objectName: 'fn_total',
        type: 123,
      })

      expect(resultado.success).toBe(false)
    })
  })

  describe('schema y objectName', () => {
    it('debería rechazar un schema vacío', () => {
      const resultado = RegisterFavoritoParamsSchema.safeParse({ schema: '', objectName: 'fn_total', type: TypeSysObjectEnum.VIEW })

      expect(resultado.success).toBe(false)
    })

    it('debería rechazar un objectName vacío', () => {
      const resultado = RegisterFavoritoParamsSchema.safeParse({ schema: 'dbo', objectName: '', type: TypeSysObjectEnum.VIEW })

      expect(resultado.success).toBe(false)
    })

    it('debería rechazar valores que son solo espacios', () => {
      const schemaEnBlanco = RegisterFavoritoParamsSchema.safeParse({ schema: '   ', objectName: 'fn_total', type: TypeSysObjectEnum.VIEW })
      const objectNameEnBlanco = RegisterFavoritoParamsSchema.safeParse({ schema: 'dbo', objectName: '   ', type: TypeSysObjectEnum.VIEW })

      expect(schemaEnBlanco.success).toBe(false)
      expect(objectNameEnBlanco.success).toBe(false)
    })

    it('debería recortar los espacios sobrantes', () => {
      expect(RegisterFavoritoParamsSchema.parse({ schema: ' dbo ', objectName: ' fn_total ', type: TypeSysObjectEnum.VIEW })).toEqual({
        schema: 'dbo',
        objectName: 'fn_total',
        type: TypeSysObjectEnum.VIEW,
      })
    })
  })
})
