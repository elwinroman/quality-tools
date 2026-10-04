import { verifyTokenMiddleware } from '@core/middlewares'
import { type Router as ExpressRouter, Router } from 'express'

import { getQueryStoreOptionsController } from './composition-root'

export function performanceRouter(): ExpressRouter {
  const router = Router()

  router.get('/query-store/options', verifyTokenMiddleware, getQueryStoreOptionsController.run.bind(getQueryStoreOptionsController))

  return router
}
