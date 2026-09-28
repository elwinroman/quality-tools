import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { ForHttpManagingBusquedaRecientePort } from '@busqueda-reciente/domain/ports/drivers/for-http-managing-busqueda-reciente.port'
import { BusquedaRecienteFilter } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { TypeSysObject } from '@sysobject/domain/schemas/sysobject'
import { NextFunction, Request, Response } from 'express'

import { GetAllBusquedaRecienteQuery, GetAllBusquedaRecienteQuerySchema } from './get-all-busqueda-reciente-query.http-dto'

export class GetAllBusquedaRecienteController {
  constructor(
    private readonly service: ForHttpManagingBusquedaRecientePort,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
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
      } = await this.currentStoreContextResolver.resolve()

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
