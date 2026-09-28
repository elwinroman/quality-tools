import { VerifyAccessTokenUseCase } from '@auth/application/use-cases/verify-access-token.use-case'
import { AccessTokenDecoded, ForTokenManagementPort } from '@auth/domain/ports/drivens/for-token-management.port'
import { SessionCredentialStore } from '@auth/domain/ports/drivens/session-credential-store.port'
import { TokenRevocationStore } from '@auth/domain/ports/drivens/token-revocation-store.port'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { Logger } from '@observability/domain/logger'
import { LoggerContext, LoggerContextUpdate } from '@observability/domain/logger-context'
import { ForbiddenException } from '@shared/application/exceptions/forbidden.exception'
import { describe, expect, it, vi } from 'vitest'

// Guarda invertida: la factory de `vi.mock` solo se ejecuta si algún módulo del grafo
// de importación de este use-case toca `@/config/enviroment`. Que NO se ejecute es la
// prueba de que el desacople es real; si algo lo importa, el test falla en vez de
// levantar la configuración de entorno.
vi.mock('@/config/enviroment', () => {
  throw new Error('VerifyAccessTokenUseCase no debe importar @/config/enviroment')
})

/**
 * Fakes en memoria: la sección de credenciales se prueba inyectando puertos
 * semánticos, sin cargar `@core/cache`, `@core/store` ni la configuración de entorno.
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

function createFakeSessionCredentialStore(overrides: Partial<SessionCredentialStore> = {}): SessionCredentialStore {
  return {
    save: async () => undefined,
    find: async () => null,
    prepareSelectedDatabaseUpdate: async () => ({ commit: async () => undefined }),
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

function createFakeTokenRevocationStore(overrides: Partial<TokenRevocationStore> = {}): TokenRevocationStore {
  return {
    isRevoked: async () => false,
    revoke: async () => undefined,
    ...overrides,
  }
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
      const verifyAccessToken = vi.fn(() => DECODED)
      const { logger, warnCalls } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const sessionCredentialStore = createFakeSessionCredentialStore({
        find: async () => {
          throw new Error('la credencial no debería consultarse cuando el token está revocado')
        },
      })
      const useCase = new VerifyAccessTokenUseCase(
        createFakeTokenManager({ verifyAccessToken }),
        createFakeTokenRevocationStore({ isRevoked: async () => true }),
        logger,
        loggerContext,
        sessionCredentialStore,
      )

      await expect(useCase.execute('token-revocado')).rejects.toBeInstanceOf(ForbiddenException)
      expect(verifyAccessToken).toHaveBeenCalledWith('token-revocado')
      expect(warnCalls).toHaveLength(1)
    })
  })

  describe('credencial ausente en caché', () => {
    it('debería consultar el cache inyectado, blacklistear el jti y lanzar CacheCredentialNotFoundException', async () => {
      const { logger } = createFakeLogger()
      const { loggerContext, updates } = createFakeLoggerContext()
      const findCalls: Array<{ userId: number; sessionId: string }> = []
      const revoke = vi.fn(async () => undefined)
      const sessionCredentialStore = createFakeSessionCredentialStore({
        find: async (userId, sessionId) => {
          findCalls.push({ userId, sessionId })
          return null
        },
      })
      const useCase = new VerifyAccessTokenUseCase(
        createFakeTokenManager(),
        createFakeTokenRevocationStore({ revoke }),
        logger,
        loggerContext,
        sessionCredentialStore,
      )

      await expect(useCase.execute('token-vigente')).rejects.toBeInstanceOf(CacheCredentialNotFoundException)

      expect(findCalls).toEqual([{ userId: DECODED.user_id, sessionId: DECODED.session_id }])

      expect(revoke).toHaveBeenCalledWith({ type: DECODED.type, jti: DECODED.jti, userId: DECODED.user_id }, DECODED.expirationCountdown)

      expect(updates.some(update => update.auth?.reason === 'cache_credentials_not_found')).toBe(true)
    })

    it('debería propagar el fallo de revocación en lugar de reemplazarlo por CacheCredentialNotFoundException', async () => {
      const revocationFailure = new Error('revocation failed')
      const { logger } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const useCase = new VerifyAccessTokenUseCase(
        createFakeTokenManager(),
        createFakeTokenRevocationStore({
          revoke: async () => {
            throw revocationFailure
          },
        }),
        logger,
        loggerContext,
        createFakeSessionCredentialStore(),
      )

      await expect(useCase.execute('token-vigente')).rejects.toBe(revocationFailure)
    })
  })
})
