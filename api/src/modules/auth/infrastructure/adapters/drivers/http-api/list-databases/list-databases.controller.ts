import { ForHttpAuthenticatingPort } from '@auth/domain/ports/drivers/for-http-authenticating.port'
import { setAuthContext } from '@auth/infrastructure/auth-context'
import { buildStoreAuthContext, extractBearerToken } from '@core/utils'
import { NextFunction, Request, Response } from 'express'

import type { ListDatabasesHttpDto } from './list-databases.dto'
import { ListDatabasesSchema } from './list-databases.dto'

export class ListDatabasesController {
  constructor(private readonly authenticatorService: ForHttpAuthenticatingPort) {}

  async run(req: Request, res: Response, next: NextFunction) {
    try {
      const credentials = await this.resolveCredentials(req)
      const result = await this.authenticatorService.listDatabases(credentials)

      return res.status(200).json({ correlationId: req.correlationId, data: result })
    } catch (err) {
      next(err)
    }
  }

  /** Resuelve las credenciales: desde cache (post-login) o directas del body (pre-login). */
  private async resolveCredentials(req: Request): Promise<ListDatabasesHttpDto> {
    const accessToken = extractBearerToken(req.headers.authorization)

    // Post-login: credenciales desde la cache del usuario autenticado
    if (accessToken) {
      const decoded = await this.authenticatorService.verifyAccessToken(accessToken)
      setAuthContext({ userId: decoded.user_id, sessionId: decoded.session_id })

      const { store } = await buildStoreAuthContext()
      const { database: _database, ...credentials } = store.credentials

      return credentials
    }

    // Pre-login: credenciales directas en el body (validadas por Zod)
    return ListDatabasesSchema.parse(req.body)
  }
}
