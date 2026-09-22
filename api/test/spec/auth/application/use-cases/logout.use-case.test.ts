import { LogoutUseCase } from '@auth/application/use-cases/logout.use-case'
import {
  AccessTokenDecoded,
  ForTokenManagementPort,
  NewTokens,
  RefreshTokenDecoded,
  TokenTypeEnum,
} from '@auth/domain/ports/drivens/for-token-management.port'
import { Logger } from '@observability/domain/logger'
import { LoggerContext, LoggerContextUpdate } from '@observability/domain/logger-context'
import { CacheRepository } from '@shared/domain/cache-repository'
import { describe, expect, it } from 'vitest'

interface CacheSetCall {
  key: string
  value: string
  ttl?: number
}

function createFakeTokenManager(overrides: Partial<ForTokenManagementPort> = {}): ForTokenManagementPort {
  return {
    createAccessToken: () => '',
    createRefreshToken: () => '',
    verifyAccessToken: () => DECODED_ACCESS_TOKEN,
    verifyRefreshToken: () => DECODED_REFRESH_TOKEN,
    checkIfUserIsAlreadyAuthenticated: () => false,
    ...overrides,
  }
}

function createFakeCacheRepository() {
  const setCalls: CacheSetCall[] = []

  const cacheRepository: CacheRepository = {
    set: async (key, value, ttl) => {
      setCalls.push({ key, value, ttl })
    },
    get: async () => null,
    delete: async () => undefined,
    ttl: async () => -2,
  }

  return { cacheRepository, setCalls }
}

function createFakeLogger() {
  const infoCalls: string[] = []

  const logger: Logger = {
    debug: () => undefined,
    info: message => {
      infoCalls.push(message)
    },
    warn: () => undefined,
    error: () => undefined,
    fatal: () => undefined,
  }

  return { logger, infoCalls }
}

function createFakeLoggerContext() {
  const updates: LoggerContextUpdate[] = []

  const loggerContext: LoggerContext = {
    set: context => {
      updates.push(context)
    },
  }

  return { loggerContext, updates }
}

const DECODED_ACCESS_TOKEN: AccessTokenDecoded = {
  user_id: 42,
  username: 'analista',
  session_id: 'session-1',
  role: 'analista',
  type: TokenTypeEnum.Access,
  jti: 'access-jti-1',
  expirationCountdown: 300,
}

const DECODED_REFRESH_TOKEN: RefreshTokenDecoded = {
  user_id: 42,
  username: 'analista',
  session_id: 'session-1',
  type: TokenTypeEnum.Refresh,
  jti: 'refresh-jti-1',
  expirationCountdown: 900,
}

const TOKENS: NewTokens = {
  accessToken: 'raw-access-token',
  refreshToken: 'raw-refresh-token',
}

describe('LogoutUseCase', () => {
  describe('cierre de sesión correcto', () => {
    it('debería verificar ambos tokens y escribir sus entradas en la blacklist', async () => {
      const verifiedAccessTokens: string[] = []
      const verifiedRefreshTokens: string[] = []
      const tokenManager = createFakeTokenManager({
        verifyAccessToken: accessToken => {
          verifiedAccessTokens.push(accessToken)
          return DECODED_ACCESS_TOKEN
        },
        verifyRefreshToken: refreshToken => {
          verifiedRefreshTokens.push(refreshToken)
          return DECODED_REFRESH_TOKEN
        },
      })
      const { cacheRepository, setCalls } = createFakeCacheRepository()
      const { logger } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const useCase = new LogoutUseCase(cacheRepository, tokenManager, logger, loggerContext)

      await useCase.execute(TOKENS)

      expect(verifiedAccessTokens).toEqual([TOKENS.accessToken])
      expect(verifiedRefreshTokens).toEqual([TOKENS.refreshToken])
      expect(setCalls).toEqual([
        {
          key: `blacklist:${DECODED_ACCESS_TOKEN.jti}`,
          value: JSON.stringify({
            type: DECODED_ACCESS_TOKEN.type,
            jti: DECODED_ACCESS_TOKEN.jti,
            user_id: DECODED_ACCESS_TOKEN.user_id,
          }),
          ttl: DECODED_ACCESS_TOKEN.expirationCountdown,
        },
        {
          key: `blacklist:${DECODED_REFRESH_TOKEN.jti}`,
          value: JSON.stringify({
            type: DECODED_REFRESH_TOKEN.type,
            jti: DECODED_REFRESH_TOKEN.jti,
            user_id: DECODED_REFRESH_TOKEN.user_id,
          }),
          ttl: DECODED_REFRESH_TOKEN.expirationCountdown,
        },
      ])
    })

    it('debería fijar el contexto de log a partir del access token decodificado', async () => {
      const { cacheRepository } = createFakeCacheRepository()
      const { logger } = createFakeLogger()
      const { loggerContext, updates } = createFakeLoggerContext()
      const useCase = new LogoutUseCase(cacheRepository, createFakeTokenManager(), logger, loggerContext)

      await useCase.execute(TOKENS)

      expect(updates).toEqual([
        {
          auth: { status: 'authenticated' },
          user: {
            userId: DECODED_ACCESS_TOKEN.user_id,
            username: DECODED_ACCESS_TOKEN.username,
            role: DECODED_ACCESS_TOKEN.role,
          },
          session: {
            id: DECODED_ACCESS_TOKEN.session_id,
            jti: DECODED_ACCESS_TOKEN.jti,
            type: DECODED_ACCESS_TOKEN.type,
            expirationCountdown: DECODED_ACCESS_TOKEN.expirationCountdown,
          },
        },
      ])
    })

    it('debería registrar el cierre y devolver el mensaje de sesión cerrada', async () => {
      const { cacheRepository } = createFakeCacheRepository()
      const { logger, infoCalls } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const useCase = new LogoutUseCase(cacheRepository, createFakeTokenManager(), logger, loggerContext)

      await expect(useCase.execute(TOKENS)).resolves.toEqual({ message: 'Sesión cerrada correctamente.' })
      expect(infoCalls).toHaveLength(1)
    })
  })

  describe('token inválido', () => {
    it('debería propagar el error y no escribir en la blacklist cuando falla la verificación', async () => {
      const tokenManager = createFakeTokenManager({
        verifyAccessToken: () => {
          throw new Error('token inválido')
        },
      })
      const { cacheRepository, setCalls } = createFakeCacheRepository()
      const { logger, infoCalls } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const useCase = new LogoutUseCase(cacheRepository, tokenManager, logger, loggerContext)

      await expect(useCase.execute(TOKENS)).rejects.toThrow('token inválido')
      expect(setCalls).toHaveLength(0)
      expect(infoCalls).toHaveLength(0)
    })
  })
})
