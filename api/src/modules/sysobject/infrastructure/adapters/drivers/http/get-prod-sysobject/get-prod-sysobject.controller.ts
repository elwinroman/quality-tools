import { ForProxyAuthenticatingPort } from '@auth/domain/ports/drivers/for-proxy-authenticating.port'
import { DatabaseName, getStaticDatabaseCredentials } from '@core/store'
import { extractBearerToken } from '@core/utils'
import { SysObjectService } from '@sysobject/application/sysobject.service'
import { LogProdObjectContext } from '@sysobject/domain/schemas/log-object-context'
import { NextFunction, Request, Response } from 'express'

import { GetProdSysObjectHttpDto, GetProdSysObjectParamsSchema } from './get-prod-sysobject.http-dto'

export class GetProdSysObjectController {
  constructor(
    private readonly sysObjectService: SysObjectService,
    private readonly authenticatorProxyAdapter: ForProxyAuthenticatingPort,
  ) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { name, schema, actionType } = req.query

    try {
      const dto: GetProdSysObjectHttpDto = GetProdSysObjectParamsSchema.parse({ name, schema, actionType })

      // obtiene le idUsuario desde el accessToken, si no existe significa que es una consulta anónima
      let idUser = null
      const accessToken = extractBearerToken(req.headers.authorization)
      // si existe el token, se válida el token
      if (accessToken) {
        const decodedToken = await this.authenticatorProxyAdapter.verifyAccessToken(accessToken)
        idUser = decodedToken.user_id
      }

      const log: LogProdObjectContext = {
        databaseName: getStaticDatabaseCredentials(DatabaseName.PREPROD).credentials.database, // nombre de la BD de producción
        idUser,
      }

      const result = await this.sysObjectService.getProdSysObject(dto.name, dto.schema, dto.actionType, log)

      return res.status(200).json({ correlationId: req.correlationId, data: result })
    } catch (err) {
      next(err)
    }
  }
}
