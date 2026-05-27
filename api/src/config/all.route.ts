import { authRouter } from '@auth/infrastructure/adapters/drivers/http-api/auth.router'
import { busquedaRecienteRouter } from '@busqueda-reciente/infrastructure/adapters/drivers/http-api/busqueda-reciente.router'
// import { finLogRouter } from '@finlog/infrastructure/adapters/drivers/http-api/fin-log.router'
import { sysObjectRouter } from '@sysobject/infrastructure/adapters/drivers/http/sysobject.route'
import { Router } from 'express'

import { favoritoRouter } from '@/modules/favorito/infrastructure/adapters/drivers/http-api/favorito.router'

export function createAllRouter(): Router {
  const router = Router()

  router.use('/api/v1/auth', authRouter())
  router.use('/api/v1/sysobject', sysObjectRouter())
  router.use('/api/v1/busqueda-reciente', busquedaRecienteRouter())
  router.use('/api/v1/favorito', favoritoRouter())

  return router
}
