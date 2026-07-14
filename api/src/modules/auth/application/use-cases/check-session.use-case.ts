import { ForStoreRepositoryPort } from '@auth/domain/ports/drivens'
import { Logger } from '@observability/domain/logger'
import { StoreUserSchema } from '@shared/domain/store'

export class CheckSessionUseCase {
  constructor(
    private readonly storeRepository: ForStoreRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(
    credentials: StoreUserSchema,
  ): Promise<{ databaseConnection: string; viewdefinitionPermission: boolean; checkedAt: Date | string }> {
    const permissionStore = await this.storeRepository.getPermission(credentials)

    const status = {
      databaseConnection: 'connected',
      viewdefinitionPermission: permissionStore.viewdefinitionPermission,
      checkedAt: new Date(),
    }

    this.logger.info('[auth] Sesión verificada')
    return status
  }
}
