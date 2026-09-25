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
          isActive: true,
        }),
      ).toEqual({
        schema: 'dbo',
        objectName: 'fn_total',
        type: tipo,
        isActive: true,
      })
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
          isActive: true,
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
        isActive: true,
      })

      expect(resultado.success).toBe(false)
    })

    it('debería rechazar un type que no sea texto', () => {
      const resultado = RegisterFavoritoParamsSchema.safeParse({
        schema: 'dbo',
        objectName: 'fn_total',
        type: 123,
        isActive: true,
      })

      expect(resultado.success).toBe(false)
    })
  })

  describe('schema y objectName', () => {
    it('debería rechazar un schema vacío', () => {
      const resultado = RegisterFavoritoParamsSchema.safeParse({
        schema: '',
        objectName: 'fn_total',
        type: TypeSysObjectEnum.VIEW,
        isActive: true,
      })

      expect(resultado.success).toBe(false)
    })

    it('debería rechazar un objectName vacío', () => {
      const resultado = RegisterFavoritoParamsSchema.safeParse({
        schema: 'dbo',
        objectName: '',
        type: TypeSysObjectEnum.VIEW,
        isActive: true,
      })

      expect(resultado.success).toBe(false)
    })

    it('debería rechazar valores que son solo espacios', () => {
      const schemaEnBlanco = RegisterFavoritoParamsSchema.safeParse({
        schema: '   ',
        objectName: 'fn_total',
        type: TypeSysObjectEnum.VIEW,
        isActive: true,
      })
      const objectNameEnBlanco = RegisterFavoritoParamsSchema.safeParse({
        schema: 'dbo',
        objectName: '   ',
        type: TypeSysObjectEnum.VIEW,
        isActive: true,
      })

      expect(schemaEnBlanco.success).toBe(false)
      expect(objectNameEnBlanco.success).toBe(false)
    })

    it('debería recortar los espacios sobrantes', () => {
      expect(
        RegisterFavoritoParamsSchema.parse({
          schema: ' dbo ',
          objectName: ' fn_total ',
          type: TypeSysObjectEnum.VIEW,
          isActive: true,
        }),
      ).toEqual({
        schema: 'dbo',
        objectName: 'fn_total',
        type: TypeSysObjectEnum.VIEW,
        isActive: true,
      })
    })
  })

  describe('isActive', () => {
    it('debería rechazar la petición sin isActive', () => {
      const resultado = RegisterFavoritoParamsSchema.safeParse({
        schema: 'dbo',
        objectName: 'fn_total',
        type: TypeSysObjectEnum.VIEW,
      })

      expect(resultado.success).toBe(false)
    })

    it('debería rechazar un isActive que no sea booleano', () => {
      const comoTexto = RegisterFavoritoParamsSchema.safeParse({
        schema: 'dbo',
        objectName: 'fn_total',
        type: TypeSysObjectEnum.VIEW,
        isActive: 'true',
      })
      const comoNumero = RegisterFavoritoParamsSchema.safeParse({
        schema: 'dbo',
        objectName: 'fn_total',
        type: TypeSysObjectEnum.VIEW,
        isActive: 0,
      })

      expect(comoTexto.success).toBe(false)
      expect(comoNumero.success).toBe(false)
    })

    it('debería aceptar false para desmarcar el favorito', () => {
      expect(
        RegisterFavoritoParamsSchema.parse({
          schema: 'dbo',
          objectName: 'fn_total',
          type: TypeSysObjectEnum.VIEW,
          isActive: false,
        }),
      ).toEqual({
        schema: 'dbo',
        objectName: 'fn_total',
        type: TypeSysObjectEnum.VIEW,
        isActive: false,
      })
    })
  })
})
