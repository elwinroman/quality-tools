import { verifyTokenMiddleware } from '@core/middlewares'
import { Router } from 'express'
import { Router as ExpressRouter } from 'express'

import {
  getProdSysObjectController,
  getSysObjectController,
  getSysObjectDependenciesController,
  getSysObjectReferencesController,
  getSysUsertableController,
  searchSuggestionsController,
} from './composition-root'

export function sysObjectRouter(): ExpressRouter {
  const router = Router()

  router.get('/search', verifyTokenMiddleware, searchSuggestionsController.run.bind(searchSuggestionsController))

  router.get('/prod', getProdSysObjectController.run.bind(getProdSysObjectController))

  router.get('/by-name', verifyTokenMiddleware, getSysObjectController.run.bind(getSysObjectController))

  router.get('/usertable/by-name', verifyTokenMiddleware, getSysUsertableController.run.bind(getSysUsertableController))

  router.get('/references', verifyTokenMiddleware, getSysObjectReferencesController.run.bind(getSysObjectReferencesController))

  router.get('/dependencies', verifyTokenMiddleware, getSysObjectDependenciesController.run.bind(getSysObjectDependenciesController))

  return router
}
