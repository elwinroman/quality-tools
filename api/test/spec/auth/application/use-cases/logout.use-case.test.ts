import { LogoutUseCase } from '@auth/application/use-cases/logout.use-case'
import {
  AccessTokenDecoded,
  ForTokenManagementPort,
  NewTokens,
  RefreshTokenDecoded,
  TokenTypeEnum,
} from '@auth/domain/ports/drivens/for-token-management.port'
import { RevocableToken, TokenRevocationStore } from '@auth/domain/ports/drivens/token-revocation-store.port'
import { Logger } from '@observability/domain/logger'
import { LoggerContext, LoggerContextUpdate } from '@observability/domain/logger-context'
import { describe, expect, it } from 'vitest'

interface RevocationCall {
  token: RevocableToken
  expiresInSeconds: number
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

function createFakeTokenRevocationStore(onRevoke?: (token: RevocableToken) => void) {
  const revocationCalls: RevocationCall[] = []

  const tokenRevocationStore: TokenRevocationStore = {
    isRevoked: async () => false,
    revoke: async (token, expiresInSeconds) => {
      revocationCalls.push({ token, expiresInSeconds })
      onRevoke?.(token)
    },
  }

  return { tokenRevocationStore, revocationCalls }
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
      const operations: string[] = []
      const verifiedAccessTokens: string[] = []
      const verifiedRefreshTokens: string[] = []
      const tokenManager = createFakeTokenManager({
        verifyAccessToken: accessToken => {
          operations.push('verify-access')
          verifiedAccessTokens.push(accessToken)
          return DECODED_ACCESS_TOKEN
        },
        verifyRefreshToken: refreshToken => {
          operations.push('verify-refresh')
          verifiedRefreshTokens.push(refreshToken)
          return DECODED_REFRESH_TOKEN
        },
      })
      const { tokenRevocationStore, revocationCalls } = createFakeTokenRevocationStore(token => {
        operations.push(`revoke-${token.type}`)
      })
      const { logger } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const useCase = new LogoutUseCase(tokenRevocationStore, tokenManager, logger, loggerContext)

      await useCase.execute(TOKENS)

      expect(verifiedAccessTokens).toEqual([TOKENS.accessToken])
      expect(verifiedRefreshTokens).toEqual([TOKENS.refreshToken])
      expect(operations).toEqual(['verify-access', 'verify-refresh', 'revoke-access_token', 'revoke-refresh_token'])
      expect(revocationCalls).toEqual([
        {
          token: {
            type: DECODED_ACCESS_TOKEN.type,
            jti: DECODED_ACCESS_TOKEN.jti,
            userId: DECODED_ACCESS_TOKEN.user_id,
          },
          expiresInSeconds: DECODED_ACCESS_TOKEN.expirationCountdown,
        },
        {
          token: {
            type: DECODED_REFRESH_TOKEN.type,
            jti: DECODED_REFRESH_TOKEN.jti,
            userId: DECODED_REFRESH_TOKEN.user_id,
          },
          expiresInSeconds: DECODED_REFRESH_TOKEN.expirationCountdown,
        },
      ])
    })

    it('debería fijar el contexto de log a partir del access token decodificado', async () => {
      const { tokenRevocationStore } = createFakeTokenRevocationStore()
      const { logger } = createFakeLogger()
      const { loggerContext, updates } = createFakeLoggerContext()
      const useCase = new LogoutUseCase(tokenRevocationStore, createFakeTokenManager(), logger, loggerContext)

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
      const { tokenRevocationStore } = createFakeTokenRevocationStore()
      const { logger, infoCalls } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const useCase = new LogoutUseCase(tokenRevocationStore, createFakeTokenManager(), logger, loggerContext)

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
      const { tokenRevocationStore, revocationCalls } = createFakeTokenRevocationStore()
      const { logger, infoCalls } = createFakeLogger()
      const { loggerContext } = createFakeLoggerContext()
      const useCase = new LogoutUseCase(tokenRevocationStore, tokenManager, logger, loggerContext)

      await expect(useCase.execute(TOKENS)).rejects.toThrow('token inválido')
      expect(revocationCalls).toHaveLength(0)
      expect(infoCalls).toHaveLength(0)
    })
  })

  it('debería propagar el fallo de revocación de access sin revocar refresh ni registrar el éxito', async () => {
    const revocationFailure = new Error('revocation failed')
    const revokeCalls: RevocableToken[] = []
    const tokenRevocationStore: TokenRevocationStore = {
      isRevoked: async () => false,
      revoke: async token => {
        revokeCalls.push(token)
        throw revocationFailure
      },
    }
    const { logger, infoCalls } = createFakeLogger()
    const { loggerContext } = createFakeLoggerContext()
    const useCase = new LogoutUseCase(tokenRevocationStore, createFakeTokenManager(), logger, loggerContext)

    await expect(useCase.execute(TOKENS)).rejects.toBe(revocationFailure)

    expect(revokeCalls).toEqual([{ type: DECODED_ACCESS_TOKEN.type, jti: DECODED_ACCESS_TOKEN.jti, userId: DECODED_ACCESS_TOKEN.user_id }])
    expect(infoCalls).toHaveLength(0)
  })
})
