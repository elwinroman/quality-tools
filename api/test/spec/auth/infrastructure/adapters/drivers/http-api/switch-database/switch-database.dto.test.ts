import { SwitchDatabaseSchema } from '@auth/infrastructure/adapters/drivers/http-api/switch-database/switch-database.dto'
import { describe, expect, it } from 'vitest'

describe('SwitchDatabaseSchema', () => {
  describe('aceptación', () => {
    it('debería aceptar una base de datos válida', () => {
      expect(SwitchDatabaseSchema.parse({ database: 'QualityTools' })).toEqual({ database: 'QualityTools' })
    })
  })

  describe('rechazo', () => {
    it('debería rechazar una base vacía, ausente o mayor a 128 caracteres', () => {
      expect(SwitchDatabaseSchema.safeParse({ database: '' }).success).toBe(false)
      expect(SwitchDatabaseSchema.safeParse({}).success).toBe(false)
      expect(SwitchDatabaseSchema.safeParse({ database: 'a'.repeat(129) }).success).toBe(false)
    })
  })
})
