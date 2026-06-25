import { ForHttpAuthenticatingPort } from '@auth/domain/ports/drivers/for-http-authenticating.port'
import { buildStoreAuthContext } from '@core/utils'
import { NextFunction, Request, Response } from 'express'

import { SwitchDatabaseSchema } from './switch-database.dto'

export class SwitchDatabaseController {
  constructor(private readonly authenticatorService: ForHttpAuthenticatingPort) {}

  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const { database } = SwitchDatabaseSchema.parse(req.body)
      const { authContext, store } = await buildStoreAuthContext()

      const result = await this.authenticatorService.switchDatabase(authContext.userId, authContext.sessionId, database, store.credentials)

      return res.status(200).json({ correlationId: req.correlationId, data: result })
    } catch (err) {
      next(err)
    }
  }
}
