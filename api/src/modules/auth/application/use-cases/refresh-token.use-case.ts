import { ForTokenBlacklistPort, ForTokenManagementPort } from '@auth/domain/ports/drivens'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { setLoggerRequestContext } from '@core/logger/logger-context'
import { getCacheDatabaseCredentials } from '@core/store'
import { ForbiddenException } from '@shared/application/exceptions'
import { CacheRepository } from '@shared/domain/cache-repository'
import { Logger } from '@shared/domain/logger'

export class RefreshTokenUseCase {
  constructor(
    private readonly tokenManager: ForTokenManagementPort,
    private readonly cacheRepository: CacheRepository,
    private readonly blacklist: ForTokenBlacklistPort,
    private readonly logger: Logger,
  ) {}

  async execute(refreshToken: string): Promise<{ accessToken: string }> {
    const decoded = this.tokenManager.verifyRefreshToken(refreshToken)

    // comprobar que el refresh token no esté en la blacklist
    const isRevoked = await this.blacklist.isBlacklisted(decoded.jti)
    if (isRevoked) {
      setLoggerRequestContext({
        auth: { status: 'failed', reason: 'revoked_token' },
        user: {
          userId: decoded.user_id,
          username: decoded.username,
          role: 'rol no definido',
        },
        session: {
          id: decoded.session_id,
          jti: decoded.jti,
          type: decoded.type,
          expirationCountdown: decoded.expirationCountdown,
        },
      })
      this.logger.warn(`[auth] Se está intentando usar un token revocado. TYPE: ${decoded.type} JTI: ${decoded.jti}`)
      throw new ForbiddenException()
    }

    // intenta recuperar las credenciales del usuario desde la caché.
    // si no existen, es probable que la caché haya sido limpiada (e.g., reinicio de infraestructura, eliminación accidental, etc.).
    const cacheCredentials = await getCacheDatabaseCredentials(decoded.user_id, decoded.session_id)
    if (!cacheCredentials) {
      setLoggerRequestContext({
        auth: { status: 'failed', reason: 'cache_credentials_not_found' },
        user: {
          userId: decoded.user_id,
          username: decoded.username,
          role: 'rol no definido',
        },
        session: {
          id: decoded.session_id,
          jti: decoded.jti,
          type: decoded.type,
          expirationCountdown: decoded.expirationCountdown,
        },
      })

      // invalida el refresh token para proteger el sistema de envío de errores ya que no se encuentra la credencial asociada en la caché
      await this.cacheRepository.set(
        `blacklist:${decoded.jti}`,
        JSON.stringify({ type: decoded.type, jti: decoded.jti, user_id: decoded.user_id }),
        decoded.expirationCountdown,
      )

      throw new CacheCredentialNotFoundException(decoded.user_id)
    }

    const accessToken = this.tokenManager.createAccessToken(decoded.user_id, decoded.username, decoded.session_id)

    // Refresh no pasa por verifyTokenMiddleware; el propio use-case fija la identidad al validar el refresh token.
    setLoggerRequestContext({
      auth: { status: 'authenticated' },
      user: {
        userId: decoded.user_id,
        username: decoded.username,
        role: 'rol no definido',
      },
      session: {
        id: decoded.session_id,
        jti: decoded.jti,
        type: decoded.type,
        expirationCountdown: decoded.expirationCountdown,
      },
    })

    this.logger.info('[auth] Token de acceso renovado', {
      actionDetails: {
        userId: decoded.user_id,
        sessionId: decoded.session_id,
        jti: decoded.jti,
        type: decoded.type,
        expirationCountdown: decoded.expirationCountdown,
      },
    })

    return { accessToken }
  }
}
