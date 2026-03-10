import { AccessTokenDecoded, ForTokenBlacklistPort, ForTokenManagementPort } from '@auth/domain/ports/drivens'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import { getCacheDatabaseCredentials } from '@core/store'
import { ForbiddenException } from '@shared/application/exceptions'
import { CacheRepository } from '@shared/domain/cache-repository'
import { Logger } from '@shared/domain/logger'

export class VerifyAccessTokenUseCase {
  constructor(
    private readonly tokenManager: ForTokenManagementPort,
    private readonly cacheRepository: CacheRepository,
    private readonly blacklist: ForTokenBlacklistPort,
    private readonly logger: Logger,
  ) {}

  async execute(token: string): Promise<AccessTokenDecoded> {
    const decoded = this.tokenManager.verifyAccessToken(token)

    // comprobar que el access token no esté en la blacklist
    const isRevoked = await this.blacklist.isBlacklisted(decoded.jti)
    if (isRevoked) {
      this.logger.warn(`[auth] Se está intentando usar un token revocado. TYPE: ${decoded.type} JTI: ${decoded.jti}`)
      throw new ForbiddenException()
    }

    // intenta recuperar las credenciales del usuario desde la caché.
    // si no existen, es probable que la caché haya sido limpiada (e.g., reinicio de infraestructura, eliminación accidental, etc.).
    const cacheCredentials = await getCacheDatabaseCredentials(decoded.user_id)

    if (!cacheCredentials) {
      // invalida el access token para proteger el sistema de envío de errores ya que no se encuentra la credencial asociada en la caché
      await this.cacheRepository.set(
        `blacklist:${decoded.jti}`,
        JSON.stringify({ type: decoded.type, jti: decoded.jti, user_id: decoded.user_id }),
        decoded.expirationCountdown,
      )

      throw new CacheCredentialNotFoundException(decoded.user_id)
    }

    this.logger.info('[auth] Token de acceso verificado', {
      actionDetails: {
        userId: decoded.user_id,
        jti: decoded.jti,
        type: decoded.type,
        expirationCountdown: decoded.expirationCountdown,
      },
    })

    return decoded
  }
}
