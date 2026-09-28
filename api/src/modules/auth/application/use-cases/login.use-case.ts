import { randomBytes } from 'node:crypto'

import { PermissionDenyException } from '@auth/domain/exceptions'
import { ForStoreRepositoryPort, ForTokenManagementPort, ForUserRepositoryPort, SessionCredentialStore } from '@auth/domain/ports/drivens'
import { AuthenticatedUser } from '@auth/domain/schemas/auth-user'
import { User } from '@auth/domain/schemas/user'
import { Logger } from '@observability/domain/logger'
import { StoreUserSchema } from '@shared/domain/store'

export class LoginUseCase {
  constructor(
    private readonly userRepository: ForUserRepositoryPort,
    private readonly storeRepository: ForStoreRepositoryPort,
    private readonly sessionCredentialStore: SessionCredentialStore,
    private readonly tokenManager: ForTokenManagementPort,
    private readonly logger: Logger,
  ) {}

  async execute(sqlUser: StoreUserSchema): Promise<AuthenticatedUser> {
    const details = await this.storeRepository.getDetails(sqlUser)
    const permissionStore = await this.storeRepository.getPermission(sqlUser)

    const user = User.create({
      user: sqlUser.user,
      host: details.server,
      aliasHost: sqlUser.host,
    })

    // se pasa los datos del usuario y el nombre de la base de datos
    const repoUser = await this.userRepository.getOrCreate(user.toValue(), details.name)

    // cuando el usuario no se pudo crear
    if (!repoUser) throw new Error('Error al obtener y/o crear el usuario')

    // denegar acceso a la aplicación a un usuario desactivado
    if (repoUser.isActive === false) throw new PermissionDenyException()

    // genera el token y las credenciales las guarda en cache (el tiempo se actualiza con la última sesión)
    const sessionId = randomBytes(16).toString('base64url')
    const accessToken = this.tokenManager.createAccessToken(repoUser.id, repoUser.user, sessionId)
    const refreshToken = this.tokenManager.createRefreshToken(repoUser.id, repoUser.user, sessionId)

    await this.sessionCredentialStore.save(repoUser.id, sessionId, {
      host: sqlUser.host,
      database: details.name,
      user: sqlUser.user,
      password: sqlUser.password,
    })

    this.logger.info('[auth] Autenticación exitosa', {
      actionDetails: {
        id: repoUser.id,
        user: repoUser.user,
        sessionId,
      },
    })

    return {
      id: repoUser.id,
      user: repoUser.user,
      aliasHost: repoUser.aliasHost,
      token: { accessToken, refreshToken },
      storeDetails: { ...details, ...permissionStore },
    }
  }
}
