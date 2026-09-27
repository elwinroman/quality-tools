import { ForHttpManagingBusquedaRecientePort } from '@busqueda-reciente/domain/ports/drivers/for-http-managing-busqueda-reciente.port'
import { BusquedaRecienteFilter } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { buildStoreAuthContext } from '@core/utils'
import { CacheRepository } from '@shared/domain/cache-repository'
import { TypeSysObject } from '@sysobject/domain/schemas/sysobject'
import { NextFunction, Request, Response } from 'express'

import { GetAllBusquedaRecienteQuery, GetAllBusquedaRecienteQuerySchema } from './get-all-busqueda-reciente-query.http-dto'

export class GetAllBusquedaRecienteController {
  constructor(
    private readonly service: ForHttpManagingBusquedaRecientePort,
    private readonly cacheRepository: CacheRepository,
  ) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { type, limit } = req.query

    try {
      const dto: GetAllBusquedaRecienteQuery = GetAllBusquedaRecienteQuerySchema.parse({ type, limit })

      // credenciales de usuario e idUser
      const {
        store: {
          credentials: { database },
        },
        authContext,
      } = await buildStoreAuthContext(this.cacheRepository)

      const filter: BusquedaRecienteFilter = {
        type: dto.type as TypeSysObject,
        idUser: authContext.userId,
        database,
      }

      const { data, meta } = await this.service.getAllBusquedaReciente(filter, dto.limit)

      return res.status(200).json({ correlationId: req.correlationId, meta, data })
    } catch (err) {
      next(err)
    }
  }
}
