import { TIPO_ACCION } from '@sysobject/application/constants/action-type.constant'
import { GetProdSysObjectParamsSchema } from '@sysobject/infrastructure/adapters/drivers/http/get-prod-sysobject/get-prod-sysobject.http-dto'
import { describe, expect, it } from 'vitest'

const validParams = { name: 'dbo.vwOrders', schema: 'dbo', actionType: TIPO_ACCION.BusquedaRegular }

describe('GetProdSysObjectParamsSchema', () => {
  describe('normalización de name y schema', () => {
    it('debería recortar los espacios de name y schema', () => {
      const parsed = GetProdSysObjectParamsSchema.parse({ ...validParams, name: '  dbo.vwOrders  ', schema: '  dbo  ' })

      expect(parsed.name).toBe('dbo.vwOrders')
      expect(parsed.schema).toBe('dbo')
    })
  })

  describe('límites de name', () => {
    it('debería aceptar los bordes de 3 y 128 caracteres', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, name: 'abc' }).success).toBe(true)
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, name: 'a'.repeat(128) }).success).toBe(true)
    })

    it('debería rechazar un name fuera de los límites', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, name: 'ab' }).success).toBe(false)
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, name: 'a'.repeat(129) }).success).toBe(false)
    })
  })

  describe('límites de schema', () => {
    it('debería aceptar el borde de 1 y 64 caracteres', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, schema: 'd' }).success).toBe(true)
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, schema: 'a'.repeat(64) }).success).toBe(true)
    })

    it('debería rechazar un schema vacío o más largo que 64', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, schema: '' }).success).toBe(false)
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, schema: 'a'.repeat(65) }).success).toBe(false)
    })

    it('debería rechazar un schema que queda vacío después de recortar', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, schema: '   ' }).success).toBe(false)
    })
  })

  describe('coerción de actionType', () => {
    it('debería convertir un actionType de texto a número', () => {
      const parsed = GetProdSysObjectParamsSchema.parse({ ...validParams, actionType: String(TIPO_ACCION.Comparacion) })

      expect(parsed.actionType).toBe(TIPO_ACCION.Comparacion)
    })

    it('debería aceptar todos los valores de TIPO_ACCION', () => {
      Object.values(TIPO_ACCION).forEach(accion => {
        expect(GetProdSysObjectParamsSchema.parse({ ...validParams, actionType: accion }).actionType).toBe(accion)
      })
    })
  })

  describe('rechazo de actionType', () => {
    it('debería rechazar un actionType fuera del catálogo', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, actionType: 0 }).success).toBe(false)
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, actionType: 99 }).success).toBe(false)
    })

    it('debería rechazar un actionType no numérico', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, actionType: 'abc' }).success).toBe(false)
    })
  })

  describe('rechazo de coerción laxa en actionType', () => {
    it('debería rechazar un booleano', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, actionType: true }).success).toBe(false)
    })

    it('debería rechazar un arreglo', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, actionType: ['2'] }).success).toBe(false)
    })

    it('debería rechazar cadenas hexadecimales, exponenciales y con espacios', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, actionType: '0x2' }).success).toBe(false)
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, actionType: '1e0' }).success).toBe(false)
      expect(GetProdSysObjectParamsSchema.safeParse({ ...validParams, actionType: ' 2 ' }).success).toBe(false)
    })
  })

  describe('campos requeridos', () => {
    it('debería rechazar la ausencia de name, schema o actionType', () => {
      expect(GetProdSysObjectParamsSchema.safeParse({ schema: 'dbo', actionType: TIPO_ACCION.BusquedaRegular }).success).toBe(false)
      expect(GetProdSysObjectParamsSchema.safeParse({ name: 'dbo.vwOrders', actionType: TIPO_ACCION.BusquedaRegular }).success).toBe(false)
      expect(GetProdSysObjectParamsSchema.safeParse({ name: 'dbo.vwOrders', schema: 'dbo' }).success).toBe(false)
    })
  })
})
