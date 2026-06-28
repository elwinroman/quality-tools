import { FavoritoNotFoundException } from '@favorito/domain/exceptions/favorito-not-found.exception'
import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { Logger } from '@observability/domain/logger'

export class DeleteFavoritoUseCase {
  constructor(
    private readonly repository: ForFavoritoRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(id: number, idUser: number): Promise<string> {
    // comprueba si el "favorito" está eliminado
    const favorito = await this.repository.getById(id)
    if (!favorito || !favorito.isActive) throw new FavoritoNotFoundException(id)

    // comprueba si pertenece al usuario y a la base de datos
    if (favorito.idUser !== idUser) throw new FavoritoNotFoundException(id)

    const deleteAction = await this.repository.deleteById(id)

    if (!deleteAction) throw new Error(`Ha ocurrido un error inesperado en la eliminación (update) del favorito con id '${id}'`)

    this.logger.info('[favorito] Favorito eliminado', {
      actionDetails: {
        favoritoId: id,
        userId: idUser,
        schema: favorito.schema,
        objectName: favorito.objectName,
        type: favorito.type,
      },
    })

    return `Se ha eliminado correctamente el favorito con id '${id}'.`
  }
}
