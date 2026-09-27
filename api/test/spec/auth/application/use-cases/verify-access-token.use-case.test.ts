import { VerifyAccessTokenUseCase } from '@auth/application/use-cases/verify-access-token.use-case'
import { ForTokenBlacklistPort } from '@auth/domain/ports/drivens/for-token-blacklist.port'
import { AccessTokenDecoded, ForTokenManagementPort } from '@auth/domain/ports/drivens/for-token-management.port'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { Logger } from '@observability/domain/logger'
import { LoggerContext, LoggerContextUpdate } from '@observability/domain/logger-context'
import { ForbiddenException } from '@shared/application/exceptions/forbidden.exception'
import { CacheRepository } from '@shared/domain/cache-repository'
import { describe, expect, it } from 'vitest'

/**
 * Fakes en memoria: la sección de credenciales debe probarse inyectando el puerto `CacheRepository`,
 * sin `vi.mock` de `@core/cache`, `@core/store` ni `@/config/enviroment`.
 */
const DECODED: AccessTokenDecoded = {
  user_id: 42,
  username: 'analista',
  session_id: 'session-1',
  role: 'admin',
  type: 'access_token',
  jti: 'jti-1',
  expirationCountdown: 900,
}

function createFakeCacheRepository(overrides: Partial<CacheRepository> = {}): CacheRepository {
  return {
    set: async () => undefined,
    get: async () => null,
    delete: async () => undefined,
    ttl: async () => -2,
    ...overrides,
  }
}

function createFakeTokenManager(overrides: Partial<ForTokenManagementPort> = {}): ForTokenManagementPort {
  return {
    createAccessToken: () => 'access-token',
    createRefreshToken: () => 'refresh-token',
    verifyAccessToken: () => DECODED,
    verifyRefreshToken: () => {
      throw new Error('verifyRefreshToken no debería invocarse')
    },
    checkIfUserIsAlreadyAuthenticated: () => true,
    ...overrides,
  }
}

function createFakeBlacklist(isBlacklisted: boolean): ForTokenBlacklistPort {
  return { isBlacklisted: async () => isBlacklisted }
}

function createFakeLogger() {
  const warnCalls: string[] = []
  const infoCalls: string[] = []

  const logger: Logger = {
    debug: () => undefined,
    info: message => infoCalls.push(message),
    warn: message => warnCalls.push(message),
    error: () => undefined,
    fatal: () => undefined,
  }

  return { logger, warnCalls, infoCalls }
}

function createFakeLoggerContext() {
  const updates: LoggerContextUpdate[] = []
  const loggerContext: LoggerContext = { set: update => updates.push(update) }

  return { loggerContext, updates }
}

describe('VerifyAccessTokenUseCase', () => {
  describe('token revocado', () => {
    it('debería lanzar ForbiddenException sin llegar a consultar la credencial en caché', async () => {
      const { logger, warnCalls } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const cacheRepository = createFakeCacheRepository({
        get: async () => {
          throw new Error('la credencial no debería consultarse cuando el token está revocado')
        },
      })
      const useCase = new VerifyAccessTokenUseCase(
        createFakeTokenManager(),
        cacheRepository,
        createFakeBlacklist(true),
        logger,
        loggerContext,
      )

      await expect(useCase.execute('token-revocado')).rejects.toBeInstanceOf(ForbiddenException)
      expect(warnCalls).toHaveLength(1)
    })
  })

  describe('credencial ausente en caché', () => {
    it('debería consultar el cache inyectado, blacklistear el jti y lanzar CacheCredentialNotFoundException', async () => {
      const { logger } = createFakeLogger()
      const { loggerContext, updates } = createFakeLoggerContext()
      const getCalls: string[] = []
      const stored: Array<{ key: string; value: string; ttl?: number }> = []
      const cacheRepository = createFakeCacheRepository({
        get: async key => {
          getCalls.push(key)
          return null // cache miss
        },
        set: async (key, value, ttl) => {
          stored.push({ key, value, ttl })
        },
      })
      const useCase = new VerifyAccessTokenUseCase(
        createFakeTokenManager(),
        cacheRepository,
        createFakeBlacklist(false),
        logger,
        loggerContext,
      )

      await expect(useCase.execute('token-vigente')).rejects.toBeInstanceOf(CacheCredentialNotFoundException)

      // la credencial se busca en el cache inyectado, no en una instancia oculta
      expect(getCalls).toEqual([`auth:credentials:${DECODED.user_id}:${DECODED.session_id}`])

      // invalida el token para que no vuelva a intentarse
      expect(stored).toHaveLength(1)
      expect(stored[0].key).toBe(`blacklist:${DECODED.jti}`)
      expect(stored[0].ttl).toBe(DECODED.expirationCountdown)
      expect(stored[0].value).toContain(`"user_id":${DECODED.user_id}`)

      expect(updates.some(update => update.auth?.reason === 'cache_credentials_not_found')).toBe(true)
    })
  })
})
