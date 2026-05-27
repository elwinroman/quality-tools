import { SysObjectService } from '@sysobject/application/sysobject.service'
import { NextFunction, Request, Response } from 'express'

import { GetSysObjectDependenciesHttpDto, GetSysObjectDependenciesQuerySchema } from './get-sysobject-dependencies.http-dto'

export class GetSysObjectDependenciesController {
  constructor(private readonly sysObjectService: SysObjectService) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { name, schema } = req.query

    try {
      const dto: GetSysObjectDependenciesHttpDto = GetSysObjectDependenciesQuerySchema.parse({ name, schema })
      const result = await this.sysObjectService.getSysObjectDependencies(dto.name, dto.schema)

      return res.status(200).json({ correlationId: req.correlationId, data: result })
    } catch (err) {
      next(err)
    }
  }
}
