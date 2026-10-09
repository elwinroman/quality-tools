import { ForFavoritoManagingPort } from '@favorito/domain/ports/drivers/for-favorito-managing.port'
import {
  FavoriteScopeContext,
  FavoriteScopeKind,
  FavoritoFilter,
  FavoritoInput,
  FavoritoRepoResponse,
  FavoritoResponse,
} from '@favorito/domain/schemas/favorito'
import { Meta } from '@shared/domain/schemas/meta'

import { GetAllFavoritosUseCase } from './use-cases/get-all-favorito.use-case'
import { RegisterFavoritoUseCase } from './use-cases/register-favorito.use-case'

export class FavoritoManagerService implements ForFavoritoManagingPort {
  constructor(
    private readonly registerFavoritoUC: RegisterFavoritoUseCase,
    private readonly getAllFavoritosUC: GetAllFavoritosUseCase,
  ) {}

  async registerFavorito(
    favoritoInput: FavoritoInput,
    context: FavoriteScopeContext,
    scopeKind: FavoriteScopeKind,
  ): Promise<{ data: FavoritoRepoResponse | null; message: string }> {
    return this.registerFavoritoUC.execute(favoritoInput, context, scopeKind)
  }

  async getAllFavoritos(filter: FavoritoFilter, limit: number): Promise<{ data: FavoritoResponse[]; meta: Meta }> {
    return this.getAllFavoritosUC.execute(filter, limit)
  }
}
