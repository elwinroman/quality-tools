import { ForStoreRepositoryPort, SessionCredentialStore } from '@auth/domain/ports/drivens'
import { PermissionStore, StoreInfo } from '@auth/domain/schemas/store'
import { Logger } from '@observability/domain/logger'
import { StoreUserSchema } from '@shared/domain/store'

export class SwitchDatabaseUseCase {
  constructor(
    private readonly sessionCredentialStore: SessionCredentialStore,
    private readonly storeRepository: ForStoreRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(
    userId: number,
    sessionId: string,
    newDatabase: string,
    currentCredentials: StoreUserSchema,
  ): Promise<StoreInfo & PermissionStore> {
    const preparedUpdate = await this.sessionCredentialStore.prepareSelectedDatabaseUpdate(userId, sessionId)
    const newCredentials: StoreUserSchema = { ...currentCredentials, database: newDatabase }

    // valida conexión a la nueva BD (lanza DatabaseError si falla)
    const details = await this.storeRepository.getDetails(newCredentials)
    const permissionStore = await this.storeRepository.getPermission(newCredentials)

    await preparedUpdate.commit({
      ...currentCredentials,
      database: details.name,
    })

    this.logger.info(`[auth] Base de datos cambiada a '${details.name}'`, {
      actionDetails: {
        userId,
        sessionId,
      },
    })

    return { ...details, ...permissionStore }
  }
}
