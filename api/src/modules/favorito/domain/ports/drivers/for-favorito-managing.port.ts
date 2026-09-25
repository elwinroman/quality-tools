import { FavoritoFilterRepo, FavoritoInput, FavoritoRepoResponse, FavoritoResponse } from '@favorito/domain/schemas/favorito'
import { Meta } from '@shared/domain/schemas/meta'

/**
 * Puerto HTTP para gestionar objetos favoritos desde la API.
 * Define las operaciones expuestas vía HTTP relacionadas con la funcionalidad de favoritos sobre objetos SQL.
 */
export interface ForFavoritoManagingPort {
  /**
   * Fija el estado de un objeto como favorito del usuario.
   *
   * Con `isActive` en `true` lo marca, o lo reactiva si estaba desmarcado; con `false` lo
   * desmarca. Es idempotente: si el estado pedido ya era el actual, no escribe nada.
   *
   * @param favoritoInput - Datos necesarios para fijar el estado del favorito
   *                        (usuario, esquema, nombre del objeto, tipo y estado deseado).
   * @returns Una promesa que resuelve con un objeto que indica:
   *          - `data`: el favorito persistido, o `null` si no había nada que escribir
   *          - `message`: mensaje contextual según el estado resultante
   */
  registerFavorito(favoritoInput: FavoritoInput): Promise<{ data: FavoritoRepoResponse | null; message: string }>

  /**
   * Recupera la lista de objetos SQL marcados como favoritos,
   * según los criterios de búsqueda indicados.
   *
   * @param filter - Filtros aplicables: usuario, nombre del objeto, tipo, base de datos, etc.
   * @param limit - Número máximo de resultados a devolver.
   * @returns Una promesa que resuelve con:
   *          - `data`: lista de favoritos encontrados
   *          - `meta`: metainformación útil para paginación o totales.
   */
  getAllFavoritos(filter: FavoritoFilterRepo, limit: number): Promise<{ data: FavoritoResponse[]; meta: Meta }>
}
