import { type Router as ExpressRouter, Router } from 'express'

import { healthController } from './composition-root'

export function healthRouter(): ExpressRouter {
  const router = Router()

  router.get('/live', healthController.live.bind(healthController))
  router.get('/ready', healthController.ready.bind(healthController))

  return router
}
