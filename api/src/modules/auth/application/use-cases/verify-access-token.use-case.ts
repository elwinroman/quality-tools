import { AccessTokenDecoded, ForTokenBlacklistPort, ForTokenManagementPort } from '@auth/domain/ports/drivens'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { getCacheDatabaseCredentials } from '@core/store'
import { ForbiddenException } from '@shared/application/exceptions'
import { CacheRepository } from '@shared/domain/cache-repository'
import { Logger } from '@shared/domain/logger'
import { LoggerContext } from '@shared/domain/logger-context'

export class VerifyAccessTokenUseCase {
  constructor(
    private readonly tokenManager: ForTokenManagementPort,
    private readonly cacheRepository: CacheRepository,
    private readonly blacklist: ForTokenBlacklistPort,
    private readonly logger: Logger,
    private readonly loggerContext: LoggerContext,
  ) {}

  async execute(token: string): Promise<AccessTokenDecoded> {
    const decoded = this.tokenManager.verifyAccessToken(token)

    // comprobar que el access token no esté en la blacklist
    const isRevoked = await this.blacklist.isBlacklisted(decoded.jti)
    if (isRevoked) {
      this.loggerContext.set({
        auth: { status: 'failed', reason: 'revoked_token' },
        user: {
          userId: decoded.user_id,
          username: decoded.username,
          role: decoded.role,
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
      this.loggerContext.set({
        auth: { status: 'failed', reason: 'cache_credentials_not_found' },
        user: {
          userId: decoded.user_id,
          username: decoded.username,
          role: decoded.role,
        },
        session: {
          id: decoded.session_id,
          jti: decoded.jti,
          type: decoded.type,
          expirationCountdown: decoded.expirationCountdown,
        },
      })

      // invalida el access token para proteger el sistema de envío de errores ya que no se encuentra la credencial asociada en la caché
      await this.cacheRepository.set(
        `blacklist:${decoded.jti}`,
        JSON.stringify({ type: decoded.type, jti: decoded.jti, user_id: decoded.user_id }),
        decoded.expirationCountdown,
      )

      throw new CacheCredentialNotFoundException(decoded.user_id)
    }

    // Este use-case emite logs antes de volver al middleware; por eso fija aquí el contexto autenticado.
    this.loggerContext.set({
      auth: { status: 'authenticated' },
      user: {
        userId: decoded.user_id,
        username: decoded.username,
        role: decoded.role,
      },
      session: {
        id: decoded.session_id,
        jti: decoded.jti,
        type: decoded.type,
        expirationCountdown: decoded.expirationCountdown,
      },
    })

    this.logger.info('[auth] Token de acceso verificado', {
      actionDetails: {
        userId: decoded.user_id,
        sessionId: decoded.session_id,
        jti: decoded.jti,
        type: decoded.type,
        expirationCountdown: decoded.expirationCountdown,
      },
    })

    return decoded
  }
}
