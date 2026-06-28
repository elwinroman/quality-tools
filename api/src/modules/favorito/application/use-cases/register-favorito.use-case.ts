import { FavoritoAlreadyExistsException } from '@favorito/domain/exceptions/favorito-already-exists.exception'
import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { FavoritoInput, FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
import { Logger } from '@observability/domain/logger'

export class RegisterFavoritoUseCase {
  constructor(
    private readonly repository: ForFavoritoRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(favoritoInput: FavoritoInput): Promise<{ data: FavoritoRepoResponse; action: 'INSERT' | 'UPDATE'; message: string }> {
    const criteria = {
      idUser: favoritoInput.idUser,
      schema: favoritoInput.schema,
      objectName: favoritoInput.objectName,
    }

    const existFavorito = await this.repository.existsByCriteria(criteria)

    if (existFavorito) throw new FavoritoAlreadyExistsException(criteria)

    const newFavorito = await this.repository.createOrUpdate({
      ...favoritoInput,
      date: new Date(), // fecha actual
      isActive: true, // al crear, vigente = 1
    })

    if (!newFavorito) throw new Error('Error al insertar o updatear un favorito')

    const message = newFavorito.action === 'INSERT' ? 'Favorito creado correctamente' : 'Favorito updateado correctamente'

    this.logger.info('[favorito] Favorito registrado', {
      actionDetails: {
        action: newFavorito.action,
        favoritoId: newFavorito.data.id,
        userId: favoritoInput.idUser,
        schema: favoritoInput.schema,
        objectName: favoritoInput.objectName,
        type: favoritoInput.type,
      },
    })

    return { data: newFavorito.data, action: newFavorito.action, message }
  }
}
