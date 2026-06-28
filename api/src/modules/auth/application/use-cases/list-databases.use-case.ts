import { ForStoreRepositoryPort } from '@auth/domain/ports/drivens'
import { Logger } from '@observability/domain/logger'
import { StoreUserSchema } from '@shared/domain/store'

export class ListDatabasesUseCase {
  constructor(
    private readonly storeRepository: ForStoreRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(credentials: Omit<StoreUserSchema, 'database'>): Promise<string[]> {
    const fullCredentials: StoreUserSchema = { ...credentials, database: 'master' }
    const dbnameList = await this.storeRepository.getDatabases(fullCredentials)

    if (!dbnameList) throw new Error('No tienes ninguna lista de base de datos')

    this.logger.info('[auth] Lista de base de datos obtenida')
    return dbnameList
  }
}
