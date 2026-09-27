import { ForHttpAuthenticatingPort } from '@auth/domain/ports/drivers/for-http-authenticating.port'
import { buildStoreAuthContext } from '@core/utils'
import { CacheRepository } from '@shared/domain/cache-repository'
import { StoreUserSchema } from '@shared/domain/store'
import { NextFunction, Request, Response } from 'express'

export class CheckSessionController {
  constructor(
    private readonly authenticatorService: ForHttpAuthenticatingPort,
    private readonly cacheRepository: CacheRepository,
  ) {}

  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const { store } = await buildStoreAuthContext(this.cacheRepository)
      const credentials: StoreUserSchema = { ...store.credentials }

      const result = await this.authenticatorService.checkSession(credentials)

      return res.status(200).json({ correlationId: req.correlationId, data: result })
    } catch (err) {
      next(err)
    }
  }
}
