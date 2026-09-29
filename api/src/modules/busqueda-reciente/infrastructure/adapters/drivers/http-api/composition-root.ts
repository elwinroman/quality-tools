import { CacheSessionCredentialStoreAdapter } from '@auth/infrastructure/adapters/drivens/cache-session-credential-store.adapter'
import { CurrentStoreContextResolverAdapter } from '@auth/infrastructure/adapters/drivens/current-store-context-resolver.adapter'
import { BusquedaRecienteHttpManagerService } from '@busqueda-reciente/application/busqueda-reciente-http-manager.service'
import { DeleteBusquedaRecienteUseCase, GetAllBusquedasRecientesUseCase } from '@busqueda-reciente/application/use-cases'
import { MssqlSysObjectRepositoryAdapter } from '@busqueda-reciente/infrastructure/adapters/drivens/mssql-sysobject-repository.adapter'
import { ValkeyCacheBusquedaRecienteRepositoryAdapter } from '@busqueda-reciente/infrastructure/adapters/drivens/valkey-busqueda-reciente-repository.adapter'
import { ValkeyCacheRepository } from '@core/cache/valkey-cache-repository'
import { createCredentialDecryptor } from '@core/crypto/create-credential-decryptor.factory'
import { createCredentialEncryptor } from '@core/crypto/create-credential-encryptor.factory'
import { logger } from '@observability/infrastructure/logging/logger-instance'

import { JWT_REFRESH_TOKEN_TTL } from '@/config/enviroment'

import { DeleteBusquedaRecienteController } from './delete-busqueda-reciente/delete-busqueda-reciente.controller'
import { GetAllBusquedaRecienteController } from './get-all-busqueda-reciente/get-all-busqueda-reciente.controller'

/*************************************
 * Inyección de dependencias API-REST
 *************************************/
const compositionRoot = () => {
  // DRIVENS
  const cacheRepository = new ValkeyCacheRepository()
  const brRepository = new ValkeyCacheBusquedaRecienteRepositoryAdapter(cacheRepository)
  const credentialDecryptor = createCredentialDecryptor()
  const credentialEncryptor = createCredentialEncryptor()
  const sessionCredentialStore = new CacheSessionCredentialStoreAdapter(
    cacheRepository,
    credentialEncryptor,
    credentialDecryptor,
    JWT_REFRESH_TOKEN_TTL,
  )
  const currentStoreContextResolver = new CurrentStoreContextResolverAdapter(sessionCredentialStore)
  const sysobjectRepository = new MssqlSysObjectRepositoryAdapter(currentStoreContextResolver)

  // USE CASES
  const deleteBusquedaRecienteUC = new DeleteBusquedaRecienteUseCase(brRepository, logger)
  const getAllBusquedaRecienteUC = new GetAllBusquedasRecientesUseCase(brRepository, sysobjectRepository, logger)

  // SERVICE ORCHESTRATOR
  const service = new BusquedaRecienteHttpManagerService(getAllBusquedaRecienteUC, deleteBusquedaRecienteUC)

  // CONTROLLERS
  const getAllBusquedaRecienteController = new GetAllBusquedaRecienteController(service, currentStoreContextResolver)
  const deleteBusquedaRecienteController = new DeleteBusquedaRecienteController(service, currentStoreContextResolver)

  return { getAllBusquedaRecienteController, deleteBusquedaRecienteController }
}

export const { getAllBusquedaRecienteController, deleteBusquedaRecienteController } = compositionRoot()
