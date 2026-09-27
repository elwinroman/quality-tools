import { BusquedaRecienteHttpManagerService } from '@busqueda-reciente/application/busqueda-reciente-http-manager.service'
import { DeleteBusquedaRecienteUseCase, GetAllBusquedasRecientesUseCase } from '@busqueda-reciente/application/use-cases'
import { MssqlSysObjectRepositoryAdapter } from '@busqueda-reciente/infrastructure/adapters/drivens/mssql-sysobject-repository.adapter'
import { ValkeyCacheBusquedaRecienteRepositoryAdapter } from '@busqueda-reciente/infrastructure/adapters/drivens/valkey-busqueda-reciente-repository.adapter'
import { ValkeyCacheRepository } from '@core/cache/valkey-cache-repository'
import { logger } from '@observability/infrastructure/logging/logger-instance'

import { DeleteBusquedaRecienteController } from './delete-busqueda-reciente/delete-busqueda-reciente.controller'
import { GetAllBusquedaRecienteController } from './get-all-busqueda-reciente/get-all-busqueda-reciente.controller'

/*************************************
 * Inyección de dependencias API-REST
 *************************************/
const compositionRoot = () => {
  // DRIVENS
  const brRepository = new ValkeyCacheBusquedaRecienteRepositoryAdapter()
  const cacheRepository = new ValkeyCacheRepository()
  const sysobjectRepository = new MssqlSysObjectRepositoryAdapter(cacheRepository)

  // USE CASES
  const deleteBusquedaRecienteUC = new DeleteBusquedaRecienteUseCase(brRepository, logger)
  const getAllBusquedaRecienteUC = new GetAllBusquedasRecientesUseCase(brRepository, sysobjectRepository, logger)

  // SERVICE ORCHESTRATOR
  const service = new BusquedaRecienteHttpManagerService(getAllBusquedaRecienteUC, deleteBusquedaRecienteUC)

  // CONTROLLERS
  const getAllBusquedaRecienteController = new GetAllBusquedaRecienteController(service, cacheRepository)
  const deleteBusquedaRecienteController = new DeleteBusquedaRecienteController(service, cacheRepository)

  return { getAllBusquedaRecienteController, deleteBusquedaRecienteController }
}

export const { getAllBusquedaRecienteController, deleteBusquedaRecienteController } = compositionRoot()
