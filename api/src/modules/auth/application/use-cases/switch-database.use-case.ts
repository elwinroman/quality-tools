import { ForStoreRepositoryPort } from '@auth/domain/ports/drivens'
import { PermissionStore, StoreInfo } from '@auth/domain/schemas/store'
import { buildAuthCredentialsCacheKey } from '@auth/utils/auth-credentials-cache-key.util'
import { CacheCredentialNotFoundException } from '@core/exceptions/cache/cache-credential-not-found.exception'
import cryptocodeUtil from '@core/utils/cryptocode.util'
import { Logger } from '@observability/domain/logger'
import { CacheRepository } from '@shared/domain/cache-repository'
import { StoreUserSchema } from '@shared/domain/store'

import { NODE_ENV } from '@/config/enviroment'
import { MODE } from '@/constants/commons'

export class SwitchDatabaseUseCase {
  constructor(
    private readonly cacheRepository: CacheRepository,
    private readonly storeRepository: ForStoreRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(
    userId: number,
    sessionId: string,
    newDatabase: string,
    currentCredentials: StoreUserSchema,
  ): Promise<StoreInfo & PermissionStore> {
    const sessionCacheKey = buildAuthCredentialsCacheKey(userId, sessionId)

    // conserva el TTL original de la sesión
    const remainingTtl = await this.cacheRepository.ttl(sessionCacheKey)
    if (remainingTtl <= 0) throw new CacheCredentialNotFoundException(userId)

    const newCredentials: StoreUserSchema = { ...currentCredentials, database: newDatabase }

    // valida conexión a la nueva BD (lanza DatabaseError si falla)
    const details = await this.storeRepository.getDetails(newCredentials)
    const permissionStore = await this.storeRepository.getPermission(newCredentials)

    // Re-encriptar credenciales antes de guardar (llegan desencriptadas desde buildStoreAuthContext)
    const cachedUser = NODE_ENV === MODE.development ? currentCredentials.user : cryptocodeUtil.encrypt(currentCredentials.user)
    const cachedPassword = NODE_ENV === MODE.development ? currentCredentials.password : cryptocodeUtil.encrypt(currentCredentials.password)

    // actualiza las credenciales en cache con la nueva BD, conservando el TTL restante
    await this.cacheRepository.set(
      sessionCacheKey,
      JSON.stringify({
        host: currentCredentials.host,
        database: details.name,
        user: cachedUser,
        password: cachedPassword,
      }),
      remainingTtl,
    )

    this.logger.info(`[auth] Base de datos cambiada a '${details.name}'`, {
      actionDetails: {
        userId,
        sessionId,
      },
    })

    return { ...details, ...permissionStore }
  }
}
