import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { ForHttpAuthenticatingPort } from '@auth/domain/ports/drivers/for-http-authenticating.port'
import { StoreUserSchema } from '@shared/domain/store'
import { NextFunction, Request, Response } from 'express'

export class CheckSessionController {
  constructor(
    private readonly authenticatorService: ForHttpAuthenticatingPort,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
  ) {}

  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const { store } = await this.currentStoreContextResolver.resolve()
      const credentials: StoreUserSchema = { ...store.credentials }

      const result = await this.authenticatorService.checkSession(credentials)

      return res.status(200).json({ correlationId: req.correlationId, data: result })
    } catch (err) {
      next(err)
    }
  }
}
