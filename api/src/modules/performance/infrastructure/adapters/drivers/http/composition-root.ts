import { CacheSessionCredentialStoreAdapter } from '@auth/infrastructure/adapters/drivens/cache-session-credential-store.adapter'
import { CurrentStoreContextResolverAdapter } from '@auth/infrastructure/adapters/drivens/current-store-context-resolver.adapter'
import { ValkeyCacheRepository } from '@core/cache/valkey-cache-repository'
import { createCredentialDecryptor } from '@core/crypto/create-credential-decryptor.factory'
import { createCredentialEncryptor } from '@core/crypto/create-credential-encryptor.factory'
import { mssqlQueryRunner } from '@core/store/mssql-query-runner-instance'

import { JWT_REFRESH_TOKEN_TTL } from '@/config/enviroment'
import { GetQueryStoreOptionsUseCase } from '@/modules/performance/application/use-cases/get-query-store-options.use-case'
import { MssqlQueryStoreOptionsRepositoryAdapter } from '@/modules/performance/infrastructure/adapters/drivens/mssql-query-store-options-repository.adapter'

import { GetQueryStoreOptionsController } from './get-query-store-options/get-query-store-options.controller'

/*************************************
 * Inyección de dependencias API-REST
 *************************************/
const compositionRoot = () => {
  // DRIVENS
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
  const optionsRepository = new MssqlQueryStoreOptionsRepositoryAdapter(mssqlQueryRunner, currentStoreContextResolver)

  // USE CASES
  const getQueryStoreOptionsUC = new GetQueryStoreOptionsUseCase(optionsRepository)

  // CONTROLLERS
  const getQueryStoreOptionsController = new GetQueryStoreOptionsController(getQueryStoreOptionsUC)

  return { getQueryStoreOptionsController }
}

export const { getQueryStoreOptionsController } = compositionRoot()
