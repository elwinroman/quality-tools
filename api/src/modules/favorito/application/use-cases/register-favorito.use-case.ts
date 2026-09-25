import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { FavoritoInput, FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
import { Logger } from '@observability/domain/logger'

export class RegisterFavoritoUseCase {
  constructor(
    private readonly repository: ForFavoritoRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(favoritoInput: FavoritoInput): Promise<{ data: FavoritoRepoResponse | null; message: string }> {
    const objectRef = `${favoritoInput.schema}.${favoritoInput.objectName}`

    const newFavorito = await this.repository.createOrUpdate({
      ...favoritoInput,
      date: new Date(), // fecha actual
    })

    if (!newFavorito) {
      if (favoritoInput.isActive) throw new Error('Error al insertar o updatear un favorito')

      this.logger.warn('[favorito] Se pidió desactivar un favorito inexistente', {
        actionDetails: { userId: favoritoInput.idUser, schema: favoritoInput.schema, objectName: favoritoInput.objectName },
      })

      return { data: null, message: `El favorito '${objectRef}' ya estaba quitado.` }
    }

    const message = newFavorito.data.isActive ? `Favorito '${objectRef}' agregado.` : `Favorito '${objectRef}' quitado.`

    this.logger.info('[favorito] Favorito registrado', {
      actionDetails: {
        favoritoId: newFavorito.data.id,
        userId: favoritoInput.idUser,
        schema: favoritoInput.schema,
        objectName: favoritoInput.objectName,
        type: favoritoInput.type,
        isActive: favoritoInput.isActive,
      },
    })

    return { data: newFavorito.data, message }
  }
}
