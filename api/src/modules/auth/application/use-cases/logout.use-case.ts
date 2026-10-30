import { ForTokenManagementPort, NewTokens, TokenRevocationStore } from '@auth/domain/ports/drivens'
import { Logger } from '@observability/domain/logger'
import { LoggerContext } from '@observability/domain/logger-context'

export class LogoutUseCase {
  constructor(
    private readonly tokenRevocationStore: TokenRevocationStore,
    private readonly tokenManager: ForTokenManagementPort,
    private readonly logger: Logger,
    private readonly loggerContext: LoggerContext,
  ) {}

  async execute(tokens: NewTokens): Promise<{ message: string }> {
    const decodedAccessToken = this.tokenManager.verifyAccessToken(tokens.accessToken)
    const decodedRefreshToken = this.tokenManager.verifyRefreshToken(tokens.refreshToken)

    // Logout valida los tokens directamente; fija el contexto para que el log de cierre no salga anónimo.
    this.loggerContext.set({
      auth: { status: 'authenticated' },
      user: {
        userId: decodedAccessToken.user_id,
        username: decodedAccessToken.username,
        role: decodedAccessToken.role,
      },
      session: {
        id: decodedAccessToken.session_id,
        jti: decodedAccessToken.jti,
        type: decodedAccessToken.type,
        expirationCountdown: decodedAccessToken.expirationCountdown,
      },
    })

    // todo: ¿verificar que los tokens estén en la blacklist?

    // si no han expirado los tokens, colocarlo en la blacklist para invalidarlos y no poderse reutilizars
    await this.tokenRevocationStore.revoke(
      { type: decodedAccessToken.type, jti: decodedAccessToken.jti, userId: decodedAccessToken.user_id },
      decodedAccessToken.expirationCountdown,
    )
    await this.tokenRevocationStore.revoke(
      { type: decodedRefreshToken.type, jti: decodedRefreshToken.jti, userId: decodedRefreshToken.user_id },
      decodedRefreshToken.expirationCountdown,
    )

    this.logger.info('[auth] Sesión cerrada correctamente')

    return { message: 'Sesión cerrada correctamente.' }
  }
}
