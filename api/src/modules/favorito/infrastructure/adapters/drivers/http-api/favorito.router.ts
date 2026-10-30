import { verifyTokenMiddleware } from '@core/middlewares'
import { type Router as ExpressRouter, Router } from 'express'

import { getAllFavoritosController, registerFavoritoController } from './composition-root'

export function favoritoRouter(): ExpressRouter {
  const router = Router()

  router.put('/', verifyTokenMiddleware, registerFavoritoController.run.bind(registerFavoritoController))
  router.get('/', verifyTokenMiddleware, getAllFavoritosController.run.bind(getAllFavoritosController))

  return router
}
