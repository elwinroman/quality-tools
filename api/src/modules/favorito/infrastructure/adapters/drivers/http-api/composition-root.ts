import { CacheSessionCredentialStoreAdapter } from '@auth/infrastructure/adapters/drivens/cache-session-credential-store.adapter'
import { CurrentStoreContextResolverAdapter } from '@auth/infrastructure/adapters/drivens/current-store-context-resolver.adapter'
import { ValkeyCacheRepository } from '@core/cache/valkey-cache-repository'
import { createCredentialDecryptor } from '@core/crypto/create-credential-decryptor.factory'
import { createCredentialEncryptor } from '@core/crypto/create-credential-encryptor.factory'
import { mssqlQueryRunner } from '@core/store/mssql-query-runner-instance'
import { FavoritoManagerService } from '@favorito/application/favorito-manager.service'
import { GetAllFavoritosUseCase } from '@favorito/application/use-cases/get-all-favorito.use-case'
import { RegisterFavoritoUseCase } from '@favorito/application/use-cases/register-favorito.use-case'
import { MSSQLFavoritoRepositoryAdapter } from '@favorito/infrastructure/adapters/drivens/mssql-favorito-repository.adapter'
import { MSSQLSysObjectRepositoryAdapter } from '@favorito/infrastructure/adapters/drivens/mssql-sysobject-repository.adapter'
import { logger } from '@observability/infrastructure/logging/logger-instance'

import { JWT_REFRESH_TOKEN_TTL } from '@/config/enviroment'

import { GetAllFavoritosController } from './controllers/get-all-favoritos/get-all-favoritos.controller'
import { RegisterFavoritoController } from './controllers/register-favorito/register-favorito.controller'

/*************************************
 * Inyección de dependencias API-REST
 *************************************/
const compositionRoot = () => {
  // DRIVENS
  const repository = new MSSQLFavoritoRepositoryAdapter(mssqlQueryRunner) // repositorio de favorito
  const cacheRepository = new ValkeyCacheRepository()
  const credentialDecryptor = createCredentialDecryptor()
  const credentialEncryptor = createCredentialEncryptor()
  const sessionCredentialStore = new CacheSessionCredentialStoreAdapter(
    cacheRepository,
    credentialEncryptor,
    credentialDecryptor,
    JWT_REFRESH_TOKEN_TTL,
  )
  const currentStoreContextResolver = new CurrentStoreContextResolverAdapter(sessionCredentialStore)
  const sysobjectRepository = new MSSQLSysObjectRepositoryAdapter(mssqlQueryRunner, currentStoreContextResolver)

  // USE CASES
  const registerFavoritoUC = new RegisterFavoritoUseCase(repository, logger)
  const getAllFavoritosUC = new GetAllFavoritosUseCase(repository, sysobjectRepository, logger)

  // SERVICE ORCHESTRATOR
  const service = new FavoritoManagerService(registerFavoritoUC, getAllFavoritosUC)

  // CONTROLLERS
  const registerFavoritoController = new RegisterFavoritoController(service, currentStoreContextResolver)
  const getAllFavoritosController = new GetAllFavoritosController(service, currentStoreContextResolver)

  return { registerFavoritoController, getAllFavoritosController }
}

export const { registerFavoritoController, getAllFavoritosController } = compositionRoot()
