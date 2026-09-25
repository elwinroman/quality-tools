import { buildStoreAuthContext } from '@core/utils'
import { ForFavoritoManagingPort } from '@favorito/domain/ports/drivers/for-favorito-managing.port'
import { FavoritoInput } from '@favorito/domain/schemas/favorito'
import { ValidTypeSysObject } from '@sysobject/domain/schemas/sysobject'
import { NextFunction, Request, Response } from 'express'

import { RegisterFavoritoParams, RegisterFavoritoParamsSchema } from './register-favorito-params.http-dto'

export class RegisterFavoritoController {
  constructor(private readonly service: ForFavoritoManagingPort) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { schema, objectName, type, isActive } = req.body

    try {
      const dto: RegisterFavoritoParams = RegisterFavoritoParamsSchema.parse({ schema, objectName, type, isActive })

      // credenciales de usuario e idUser
      const { authContext } = await buildStoreAuthContext()

      const input: FavoritoInput = {
        idUser: authContext.userId,
        schema: dto.schema,
        objectName: dto.objectName,
        type: dto.type as ValidTypeSysObject,
        isActive: dto.isActive,
      }

      const result = await this.service.registerFavorito(input)

      return res.status(200).json({ correlationId: req.correlationId, message: result.message, data: result.data })
    } catch (err) {
      next(err)
    }
  }
}
