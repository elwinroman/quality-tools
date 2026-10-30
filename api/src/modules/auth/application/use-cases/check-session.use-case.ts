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
  ): Promise<{ databaseConnection: string; viewdefinitionPermission: boolean; checkedAt: Date | string; database: string }> {
    const permissionStore = await this.storeRepository.getPermission(credentials)

    const status = {
      databaseConnection: 'connected',
      viewdefinitionPermission: permissionStore.viewdefinitionPermission,
      checkedAt: new Date(),
      // la base de datos activa la posee la sesión en el servidor; se expone para que el cliente no mantenga su propia copia
      database: credentials.database,
    }

    this.logger.info('[auth] Sesión verificada')
    return status
  }
}
