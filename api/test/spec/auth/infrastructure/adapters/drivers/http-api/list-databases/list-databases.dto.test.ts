import { ListDatabasesSchema } from '@auth/infrastructure/adapters/drivers/http-api/list-databases/list-databases.dto'
import { describe, expect, it } from 'vitest'

describe('ListDatabasesSchema', () => {
  const validRequest = { host: 'database.local', user: 'analista', password: 'secret' }

  describe('aceptación', () => {
    it('debería aceptar credenciales válidas incluyendo password vacía', () => {
      expect(ListDatabasesSchema.parse(validRequest)).toEqual(validRequest)
      expect(ListDatabasesSchema.parse({ ...validRequest, password: '' })).toEqual({ ...validRequest, password: '' })
    })
  })

  describe('rechazo', () => {
    it('debería rechazar host o user vacíos o ausentes', () => {
      expect(ListDatabasesSchema.safeParse({ ...validRequest, host: '' }).success).toBe(false)
      expect(ListDatabasesSchema.safeParse({ ...validRequest, user: '' }).success).toBe(false)
      expect(ListDatabasesSchema.safeParse({ user: 'analista', password: 'secret' }).success).toBe(false)
    })

    it('debería rechazar campos que superan los 64 caracteres', () => {
      expect(ListDatabasesSchema.safeParse({ ...validRequest, host: 'a'.repeat(65) }).success).toBe(false)
      expect(ListDatabasesSchema.safeParse({ ...validRequest, password: 'a'.repeat(65) }).success).toBe(false)
    })
  })
})
