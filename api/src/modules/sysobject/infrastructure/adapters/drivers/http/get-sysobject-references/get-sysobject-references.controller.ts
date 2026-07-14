import { SysObjectService } from '@sysobject/application/sysobject.service'
import { NextFunction, Request, Response } from 'express'

import { GetSysObjectReferencesHttpDto, GetSysObjectReferencesQuerySchema } from './get-sysobject-references.http-dto'

export class GetSysObjectReferencesController {
  constructor(private readonly sysObjectService: SysObjectService) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { name, schema } = req.query

    try {
      const dto: GetSysObjectReferencesHttpDto = GetSysObjectReferencesQuerySchema.parse({ name, schema })
      const result = await this.sysObjectService.getSysObjectDependents(dto.name, dto.schema)

      return res.status(200).json({ correlationId: req.correlationId, meta: result.meta, data: result.data })
    } catch (err) {
      next(err)
    }
  }
}
