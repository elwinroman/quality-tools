import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { ForUserRepositoryPort } from '@auth/domain/ports/drivens/for-user-repository.port'
import { ForFavoritoManagingPort } from '@favorito/domain/ports/drivers/for-favorito-managing.port'
import { FavoriteScopeContext, FavoritoInput } from '@favorito/domain/schemas/favorito'
import { ValidTypeSysObject } from '@sysobject/domain/schemas/sysobject'
import { NextFunction, Request, Response } from 'express'

import { RegisterFavoritoParams, RegisterFavoritoParamsSchema } from './register-favorito-params.http-dto'

export class RegisterFavoritoController {
  constructor(
    private readonly service: ForFavoritoManagingPort,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
    private readonly userRepository: ForUserRepositoryPort,
  ) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { schema, objectName, type, isActive, scope } = req.body

    try {
      const dto: RegisterFavoritoParams = RegisterFavoritoParamsSchema.parse({ schema, objectName, type, isActive, scope })

      // credenciales de usuario e idUser
      const { authContext, store } = await this.currentStoreContextResolver.resolve()

      // El servidor del alcance es el de la instancia del usuario (cServer / @@SERVERNAME),
      // no el alias que tipea el usuario. La base es la del store activo de la sesión.
      const user = await this.userRepository.getById(authContext.userId)

      if (!user) throw new Error('No se pudo resolver el servidor del usuario autenticado')

      const context: FavoriteScopeContext = {
        serverName: user.host,
        databaseName: store.credentials.database,
      }

      const input: FavoritoInput = {
        idUser: authContext.userId,
        schema: dto.schema,
        objectName: dto.objectName,
        type: dto.type as ValidTypeSysObject,
        isActive: dto.isActive,
      }

      const result = await this.service.registerFavorito(input, context, dto.scope)

      return res.status(200).json({ correlationId: req.correlationId, message: result.message, data: result.data })
    } catch (err) {
      next(err)
    }
  }
}
