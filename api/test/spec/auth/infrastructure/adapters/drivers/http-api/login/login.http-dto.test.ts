import { LoginUserSchema } from '@auth/infrastructure/adapters/drivers/http-api/login/login.http-dto'
import { describe, expect, it } from 'vitest'

describe('LoginUserSchema', () => {
  const validLogin = {
    host: 'database.local',
    database: 'QualityTools',
    user: 'analista',
    password: 'secret',
  }

  describe('aceptación', () => {
    it('debería aceptar credenciales válidas incluyendo password vacía', () => {
      expect(LoginUserSchema.parse(validLogin)).toEqual(validLogin)
      expect(LoginUserSchema.parse({ ...validLogin, password: '' })).toEqual({ ...validLogin, password: '' })
    })
  })

  describe('rechazo', () => {
    it('debería rechazar host, database o user vacíos o ausentes', () => {
      expect(LoginUserSchema.safeParse({ ...validLogin, host: '' }).success).toBe(false)
      expect(LoginUserSchema.safeParse({ ...validLogin, database: '' }).success).toBe(false)
      expect(LoginUserSchema.safeParse({ ...validLogin, user: '' }).success).toBe(false)
      expect(LoginUserSchema.safeParse({ host: 'database.local', user: 'analista', password: 'secret' }).success).toBe(false)
    })

    it('debería rechazar campos que superan los 64 caracteres', () => {
      expect(LoginUserSchema.safeParse({ ...validLogin, host: 'a'.repeat(65) }).success).toBe(false)
      expect(LoginUserSchema.safeParse({ ...validLogin, password: 'a'.repeat(65) }).success).toBe(false)
    })
  })
})
