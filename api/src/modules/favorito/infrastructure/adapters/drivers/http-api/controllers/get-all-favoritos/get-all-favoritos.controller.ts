import { buildStoreAuthContext } from '@core/utils'
import { ForFavoritoManagingPort } from '@favorito/domain/ports/drivers/for-favorito-managing.port'
import { FavoritoFilter } from '@favorito/domain/schemas/favorito'
import { TypeSysObject } from '@sysobject/domain/schemas/sysobject'
import { NextFunction, Request, Response } from 'express'

import { GetAllFavoritosQuery, GetAllFavoritosQuerySchema } from './get-all-favoritos-query.http-dto'

export class GetAllFavoritosController {
  constructor(private readonly service: ForFavoritoManagingPort) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { type, limit } = req.query

    try {
      const dto: GetAllFavoritosQuery = GetAllFavoritosQuerySchema.parse({ type, limit })

      // credenciales de usuario e idUser
      const { authContext } = await buildStoreAuthContext()

      const filter: FavoritoFilter = {
        type: dto.type as TypeSysObject,
        idUser: authContext.userId,
      }

      const { data, meta } = await this.service.getAllFavoritos(filter, dto.limit)

      return res.status(200).json({ correlationId: req.correlationId, meta, data })
    } catch (err) {
      next(err)
    }
  }
}
