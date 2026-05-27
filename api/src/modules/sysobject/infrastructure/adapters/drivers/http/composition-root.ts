import { authenticatorProxyAdapter } from '@auth/infrastructure/adapters/drivers/proxies/composition-root'
import { logger } from '@core/logger/pino-instance'
import { SysObjectService } from '@sysobject/application/sysobject.service'
import { GetProdSysObjectUseCase } from '@sysobject/application/use-cases/get-prod-sysobject.use-case'
import { GetSysObjectUseCase } from '@sysobject/application/use-cases/get-sysobject.use-case'
import { GetSysObjectDependenciesUseCase } from '@sysobject/application/use-cases/get-sysobject-dependencies.use-case'
import { GetSysObjectDependentsUseCase } from '@sysobject/application/use-cases/get-sysobject-dependents.use-case'
import { GetSysUsertableUseCase } from '@sysobject/application/use-cases/get-sysusertable.use-case'
import { RegisterSearchLogUseCase } from '@sysobject/application/use-cases/register-search-log.use-case'
import { SearchSuggestionsUseCase } from '@sysobject/application/use-cases/search-suggestions.use-case'
import { MssqlLogRepositoryAdapter } from '@sysobject/infrastructure/adapters/drivens/mssql-log-repository.adapter'
import { MssqlProdSysObjectRepositoryAdapter } from '@sysobject/infrastructure/adapters/drivens/mssql-prod-sysobject-repository.adapter'
import { MssqlSysObjectRepositoryAdapter } from '@sysobject/infrastructure/adapters/drivens/mssql-sysobject-repository.adapter'
import { MssqlSysUsertableRepositoryAdapter } from '@sysobject/infrastructure/adapters/drivens/mssql-sysusertable-repositorey.adapter'
import { RegisterBusquedaRecienteProxyAdapter } from '@sysobject/infrastructure/adapters/drivens/register-busqueda-reciente-proxy.adapter'

import { GetProdSysObjectController } from './get-prod-sysobject/get-prod-sysobject.controller'
import { GetSysObjectController } from './get-sysobject/get-sysobject.controller'
import { GetSysObjectDependenciesController } from './get-sysobject-dependencies/get-sysobject-dependencies.controller'
import { GetSysObjectReferencesController } from './get-sysobject-references/get-sysobject-references.controller'
import { GetSysUsertableController } from './get-sysusertable/get-sysusertable.controller'
import { SearchSuggestionsController } from './search-suggestions/search-suggestions.controller'
/*************************************
 * Inyección de dependencias API-REST
 *************************************/
const compositionMock = () => {
  // DRIVENS
  const sysObjectRepository = new MssqlSysObjectRepositoryAdapter()
  const sysUsertableRepository = new MssqlSysUsertableRepositoryAdapter()
  const prodSysObjectRepository = new MssqlProdSysObjectRepositoryAdapter()
  const logRepository = new MssqlLogRepositoryAdapter()
  // proxy
  const registerBusquedaRecienteProxy = new RegisterBusquedaRecienteProxyAdapter()

  // USE CASES
  const registerSearchLogUseCase = new RegisterSearchLogUseCase(logRepository, logger)

  const getSysObjectUseCase = new GetSysObjectUseCase(sysObjectRepository, registerSearchLogUseCase, registerBusquedaRecienteProxy, logger) // se pasa el contexto para el registro de LOGs de búsqueda
  const searchSuggestionsUseCase = new SearchSuggestionsUseCase(sysObjectRepository)
  const getSysObjectDependentsUseCase = new GetSysObjectDependentsUseCase(sysObjectRepository, logger)
  const getSysObjectDependenciesUseCase = new GetSysObjectDependenciesUseCase(sysObjectRepository, logger)
  const getSysUsertableUseCase = new GetSysUsertableUseCase(
    sysUsertableRepository,
    registerSearchLogUseCase,
    registerBusquedaRecienteProxy,
    logger,
  )

  const getProdSysObjectUseCase = new GetProdSysObjectUseCase(prodSysObjectRepository, registerSearchLogUseCase, logger)

  // SERVICE ORCHESTRATOR
  const sysObjectService = new SysObjectService(
    getSysObjectUseCase,
    searchSuggestionsUseCase,
    getSysUsertableUseCase,
    getProdSysObjectUseCase,
    getSysObjectDependentsUseCase,
    getSysObjectDependenciesUseCase,
  )

  // CONTROLLERS
  const searchSuggestionsController = new SearchSuggestionsController(sysObjectService)
  const getSysObjectController = new GetSysObjectController(sysObjectService)
  const getSysUsertableController = new GetSysUsertableController(sysObjectService)
  const getProdSysObjectController = new GetProdSysObjectController(sysObjectService, authenticatorProxyAdapter)
  const getSysObjectReferencesController = new GetSysObjectReferencesController(sysObjectService)
  const getSysObjectDependenciesController = new GetSysObjectDependenciesController(sysObjectService)

  return {
    getSysObjectController,
    searchSuggestionsController,
    getSysUsertableController,
    getProdSysObjectController,
    getSysObjectReferencesController,
    getSysObjectDependenciesController,
  }
}
export const {
  getSysObjectController,
  searchSuggestionsController,
  getSysUsertableController,
  getProdSysObjectController,
  getSysObjectReferencesController,
  getSysObjectDependenciesController,
} = compositionMock()
