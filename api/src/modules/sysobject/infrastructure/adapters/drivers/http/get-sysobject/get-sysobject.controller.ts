import { buildStoreAuthContext } from '@core/utils'
import { SysObjectService } from '@sysobject/application/sysobject.service'
import { LogObjectContext } from '@sysobject/domain/schemas/log-object-context'
import { NextFunction, Request, Response } from 'express'

import { GetSysObjectHttpDto, GetSysObjectQuerySchema } from './get-sysobject.http-dto'

export class GetSysObjectController {
  constructor(private readonly sysObjectService: SysObjectService) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { name, schema } = req.query

    try {
      const dto: GetSysObjectHttpDto = GetSysObjectQuerySchema.parse({ name, schema })

      const { store, authContext } = await buildStoreAuthContext()
      const log: LogObjectContext = {
        databaseName: store.credentials.database,
        idUser: authContext.userId,
      }

      const result = await this.sysObjectService.getSysObjectBySchemaAndName(dto.schema, dto.name, log)

      return res.status(200).json({ correlationId: req.correlationId, data: result })
    } catch (err) {
      next(err)
    }
  }
}
