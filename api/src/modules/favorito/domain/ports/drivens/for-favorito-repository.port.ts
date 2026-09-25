import { Favorito, FavoritoFilterRepo, FavoritoRepoInput, FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
import { Meta } from '@shared/domain/schemas/meta'

/**
 * Puerto de repositorio para la persistencia de objetos favoritos.
 * Define las operaciones necesarias para almacenar y consultar favoritos
 * en la fuente de datos correspondiente (base de datos, memoria, etc.).
 */
export interface ForFavoritoRepositoryPort {
  /**
   * Crea un nuevo favorito o actualiza uno existente si ya fue registrado previamente
   * por el mismo usuario y con las mismas propiedades clave
   * (usuario + esquema + nombre de objeto).
   *
   * @param favoritoRepoInput - Datos del favorito, incluyendo el estado deseado (`isActive`).
   * @returns Un objeto con los datos persistidos, o `null` si no se escribió nada: porque se
   *          pidió desactivar un favorito que no existía, o porque la escritura no afectó filas.
   */
  createOrUpdate(favoritoRepoInput: FavoritoRepoInput): Promise<{ data: FavoritoRepoResponse } | null>

  /**
   * Recupera una lista paginada de favoritos según los criterios de búsqueda.
   *
   * @param filter - Filtros a aplicar (usuario, tipo de objeto, etc.).
   * @param limit - Cantidad máxima de resultados a retornar.
   * @returns Un objeto que contiene:
   *          - `data`: lista de favoritos encontrados.
   *          - `meta`: metainformación como total de registros o página actual.
   */
  findMany(filter: FavoritoFilterRepo, limit: number): Promise<{ data: FavoritoRepoResponse[]; meta: Meta }>

  /**
   * Recupera un favorito por su ID. (huerfano temporalemente)
   *
   * @param id - ID del favorito a recuperar.
   * @returns Un objeto `Favorito` si se encuentra, o `null` si no existe.
   */
  getById(id: number): Promise<Favorito | null>
}
