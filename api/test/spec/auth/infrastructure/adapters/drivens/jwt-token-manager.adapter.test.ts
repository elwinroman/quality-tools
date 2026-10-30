import { randomUUID } from 'node:crypto'

import { TokenExpiredException } from '@auth/application/exceptions/token-expired.exception'
import { TokenTypeEnum } from '@auth/domain/ports/drivens/for-token-management.port'
import { JwtTokenManagerAdapter } from '@auth/infrastructure/adapters/drivens/jwt-token-manager.adapter'
import { UnauthorizedException } from '@shared/application/exceptions/unauthorized.exception'
import jwt from 'jsonwebtoken'
import { describe, expect, it, vi } from 'vitest'

// Evita cargar `@/config/enviroment` real (puede llamar a process.exit(1)) y fija
// el secreto con el que el propio test firma/verifica los tokens.
const { TEST_SECRET } = vi.hoisted(() => ({ TEST_SECRET: 'test-secret' }))

vi.mock('@/config/enviroment', () => ({
  JWT_SECRET: TEST_SECRET,
  JWT_ACCESS_TOKEN_TTL: 900,
  JWT_REFRESH_TOKEN_TTL: 2_592_000,
}))

describe('JwtTokenManagerAdapter', () => {
  const adapter = new JwtTokenManagerAdapter()

  describe('createAccessToken', () => {
    it('debería firmar el payload con los claims de sesión y tipo access_token', () => {
      const token = adapter.createAccessToken(42, 'analista', 'session-1')
      const decoded = jwt.verify(token, TEST_SECRET) as jwt.JwtPayload

      expect(decoded.user_id).toBe(42)
      expect(decoded.username).toBe('analista')
      expect(decoded.session_id).toBe('session-1')
      expect(decoded.type).toBe(TokenTypeEnum.Access)
      expect(decoded.jti).toMatch(/^[0-9a-f-]{36}$/)
    })
  })

  describe('createRefreshToken', () => {
    it('debería firmar el payload con session_id, jti y tipo refresh_token', () => {
      const token = adapter.createRefreshToken(42, 'analista', 'session-1')
      const decoded = jwt.verify(token, TEST_SECRET) as jwt.JwtPayload

      expect(decoded.session_id).toBe('session-1')
      expect(decoded.type).toBe(TokenTypeEnum.Refresh)
      expect(decoded.jti).toMatch(/^[0-9a-f-]{36}$/)
    })
  })

  describe('verifyAccessToken', () => {
    it('debería mapear un token expirado a TokenExpiredException', () => {
      const expired = jwt.sign(
        { user_id: 1, username: 'u', session_id: 's', role: 'r', type: TokenTypeEnum.Access, jti: randomUUID() },
        TEST_SECRET,
        { expiresIn: -10 },
      )

      expect(() => adapter.verifyAccessToken(expired)).toThrow(TokenExpiredException)
    })

    it('debería mapear un token malformado o alterado a UnauthorizedException', () => {
      const otherSecret = jwt.sign(
        { user_id: 1, username: 'u', session_id: 's', role: 'r', type: TokenTypeEnum.Access, jti: randomUUID() },
        'otro-secreto',
        { expiresIn: 900 },
      )

      expect(() => adapter.verifyAccessToken('no-es-un-jwt')).toThrow(UnauthorizedException)
      expect(() => adapter.verifyAccessToken(otherSecret)).toThrow(UnauthorizedException)
    })

    it('debería rechazar un token firmado con el secreto correcto pero sin session_id', () => {
      const incomplete = jwt.sign({ user_id: 1, username: 'u', jti: randomUUID() }, TEST_SECRET, { expiresIn: 900 })

      expect(() => adapter.verifyAccessToken(incomplete)).toThrow(UnauthorizedException)
    })

    it('debería devolver los claims de sesión del token válido', () => {
      const token = adapter.createAccessToken(42, 'analista', 'session-1')
      const decoded = adapter.verifyAccessToken(token)

      expect(decoded).toMatchObject({
        user_id: 42,
        username: 'analista',
        session_id: 'session-1',
        type: TokenTypeEnum.Access,
      })
      expect(decoded.expirationCountdown).toBeGreaterThan(0)
      expect(decoded.expirationCountdown).toBeLessThanOrEqual(900)
    })
  })

  describe('verifyRefreshToken', () => {
    it('debería mapear un refresh token expirado a TokenExpiredException', () => {
      const expired = jwt.sign(
        { user_id: 1, username: 'u', session_id: 's', type: TokenTypeEnum.Refresh, jti: randomUUID() },
        TEST_SECRET,
        {
          expiresIn: -10,
        },
      )

      expect(() => adapter.verifyRefreshToken(expired)).toThrow(TokenExpiredException)
    })

    it('debería mapear un refresh token malformado a UnauthorizedException', () => {
      expect(() => adapter.verifyRefreshToken('no-es-un-jwt')).toThrow(UnauthorizedException)
    })
  })
})
