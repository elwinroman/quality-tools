import { PermissionDenyException } from '@auth/domain/exceptions'
import { ForStoreRepositoryPort, ForTokenManagementPort, ForUserRepositoryPort } from '@auth/domain/ports/drivens'
import { AuthenticatedUser } from '@auth/domain/schemas/auth-user'
import { User } from '@auth/domain/schemas/user'
import cryptocodeUtil from '@core/utils/cryptocode.util'
import { CacheRepository } from '@shared/domain/cache-repository'
import { Logger } from '@shared/domain/logger'
import { StoreUserSchema } from '@shared/domain/store'

import { JWT_REFRESH_TOKEN_TTL, NODE_ENV } from '@/config/enviroment'
import { MODE } from '@/constants/commons'

export class LoginUseCase {
  constructor(
    private readonly userRepository: ForUserRepositoryPort,
    private readonly storeRepository: ForStoreRepositoryPort,
    private readonly cacheRepository: CacheRepository,
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
    const accessToken = this.tokenManager.createAccessToken(repoUser.id, repoUser.user)
    const refreshToken = this.tokenManager.createRefreshToken(repoUser.id, repoUser.user)

    // En producción, encriptar credenciales antes de guardar en cache
    const cachedUser = NODE_ENV === MODE.development ? sqlUser.user : cryptocodeUtil.encrypt(sqlUser.user)
    const cachedPassword = NODE_ENV === MODE.development ? sqlUser.password : cryptocodeUtil.encrypt(sqlUser.password)

    await this.cacheRepository.set(
      `auth:credentials:${repoUser.id}`,
      JSON.stringify({
        host: sqlUser.host,
        database: details.name,
        user: cachedUser,
        password: cachedPassword,
      }),
      JWT_REFRESH_TOKEN_TTL,
    )

    this.logger.info('[auth] Autenticación exitosa', {
      actionDetails: {
        id: repoUser.id,
        user: repoUser.user,
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
