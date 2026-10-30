import { DeleteBusquedaRecienteParamsSchema } from '@busqueda-reciente/infrastructure/adapters/drivers/http-api/delete-busqueda-reciente/delete-busqueda-reciente.http-dto'
import { describe, expect, it } from 'vitest'

describe('DeleteBusquedaRecienteParamsSchema', () => {
  describe('longitud de id', () => {
    it('debería aceptar un id de exactamente 32 caracteres', () => {
      const id = 'a'.repeat(32)

      expect(DeleteBusquedaRecienteParamsSchema.parse({ id })).toEqual({ id })
    })

    it('debería rechazar un id con longitud distinta de 32', () => {
      expect(DeleteBusquedaRecienteParamsSchema.safeParse({ id: 'a'.repeat(31) }).success).toBe(false)
      expect(DeleteBusquedaRecienteParamsSchema.safeParse({ id: 'a'.repeat(33) }).success).toBe(false)
    })

    it('debería rechazar un id que no sea texto', () => {
      expect(DeleteBusquedaRecienteParamsSchema.safeParse({ id: 32 }).success).toBe(false)
    })
  })
})
