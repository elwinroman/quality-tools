import { ProxyBusquedaRecienteService } from '@busqueda-reciente/application/busqueda-reciente-proxy-manager.service'
import { RegisterBusquedaRecienteUseCase } from '@busqueda-reciente/application/use-cases'
import { ValkeyCacheBusquedaRecienteRepositoryAdapter } from '@busqueda-reciente/infrastructure/adapters/drivens/valkey-busqueda-reciente-repository.adapter'
import { logger } from '@observability/infrastructure/logging/logger-instance'

import { RegisterBusquedaRecienteProxy } from './register-busqueda-reciente-proxy.adapter'

/*************************************
 * Inyección de dependencias PROXY
 *************************************/
const compositionRoot = () => {
  // DRIVENS
  const repository = new ValkeyCacheBusquedaRecienteRepositoryAdapter()

  // USE CASES
  const registerBusquedaRecienteUseCase = new RegisterBusquedaRecienteUseCase(repository, logger)

  // SERVICE ORCHESTRATOR
  const service = new ProxyBusquedaRecienteService(registerBusquedaRecienteUseCase)

  // PROXY ADAPTER
  const registerBusquedaRecienteProxy = new RegisterBusquedaRecienteProxy(service)

  return { registerBusquedaRecienteProxy }
}

export const { registerBusquedaRecienteProxy } = compositionRoot()
