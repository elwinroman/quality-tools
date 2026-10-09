import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { ForUserRepositoryPort } from '@auth/domain/ports/drivens/for-user-repository.port'
import { ForFavoritoManagingPort } from '@favorito/domain/ports/drivers/for-favorito-managing.port'
import { FavoriteScopeContext, FavoritoFilter } from '@favorito/domain/schemas/favorito'
import { TypeSysObject } from '@sysobject/domain/schemas/sysobject'
import { NextFunction, Request, Response } from 'express'

import { GetAllFavoritosQuery, GetAllFavoritosQuerySchema } from './get-all-favoritos-query.http-dto'

export class GetAllFavoritosController {
  constructor(
    private readonly service: ForFavoritoManagingPort,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
    private readonly userRepository: ForUserRepositoryPort,
  ) {}

  async run(req: Request, res: Response, next: NextFunction) {
    const { type, limit } = req.query

    try {
      const dto: GetAllFavoritosQuery = GetAllFavoritosQuerySchema.parse({ type, limit })

      // credenciales de usuario e idUser
      const { authContext, store } = await this.currentStoreContextResolver.resolve()

      // El contexto de alcance se resuelve server-side: servidor de la instancia del usuario
      // (cServer / @@SERVERNAME) y la base del store activo de la sesión.
      const user = await this.userRepository.getById(authContext.userId)

      if (!user) throw new Error('No se pudo resolver el servidor del usuario autenticado')

      const context: FavoriteScopeContext = {
        serverName: user.host,
        databaseName: store.credentials.database,
      }

      const filter: FavoritoFilter = {
        type: dto.type as TypeSysObject,
        idUser: authContext.userId,
        context,
      }

      const { data, meta } = await this.service.getAllFavoritos(filter, dto.limit)

      return res.status(200).json({ correlationId: req.correlationId, meta, data })
    } catch (err) {
      next(err)
    }
  }
}
