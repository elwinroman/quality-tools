import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { ForHttpAuthenticatingPort } from '@auth/domain/ports/drivers/for-http-authenticating.port'
import { NextFunction, Request, Response } from 'express'

import { SwitchDatabaseSchema } from './switch-database.dto'

export class SwitchDatabaseController {
  constructor(
    private readonly authenticatorService: ForHttpAuthenticatingPort,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
  ) {}

  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const { database } = SwitchDatabaseSchema.parse(req.body)
      const { authContext, store } = await this.currentStoreContextResolver.resolve()

      const result = await this.authenticatorService.switchDatabase(authContext.userId, authContext.sessionId, database, store.credentials)

      return res.status(200).json({ correlationId: req.correlationId, data: result })
    } catch (err) {
      next(err)
    }
  }
}
