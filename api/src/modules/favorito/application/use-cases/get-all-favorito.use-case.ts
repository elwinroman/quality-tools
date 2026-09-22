import { SysobjectIdsInconsistencyException } from '@core/exceptions/store/sysobject-ids-inconsistency.exception'
import { parseSqlObjectTypeCondition } from '@core/utils/parse-sysobject-type.util'
import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { ForSysObjectRepositoryPort } from '@favorito/domain/ports/drivens/for-sysobject-repository.port'
import { FavoritoFilter, FavoritoResponse } from '@favorito/domain/schemas/favorito'
import { Logger } from '@observability/domain/logger'
import { Meta } from '@shared/domain/schemas/meta'

export class GetAllFavoritosUseCase {
  constructor(
    private readonly repository: ForFavoritoRepositoryPort,
    private readonly sysobjectRepository: ForSysObjectRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(filter: FavoritoFilter, limit: number): Promise<{ data: FavoritoResponse[]; meta: Meta }> {
    const typeFormatCondition = parseSqlObjectTypeCondition(filter.type) // formatea el tipo de objeto para inyetarse en sql
    const filterFormated = { ...filter, type: typeFormatCondition }
    const { data, meta } = await this.repository.findMany(filterFormated, limit)

    // si no existes registros enviar el array vacio
    if (data.length === 0) {
      this.logger.info('[favorito] Favoritos obtenidos', {
        actionDetails: {
          userId: filter.idUser,
          type: filter.type,
          count: 0,
          total: meta.total,
          limit: meta.limit,
        },
      })

      return { data: [], meta }
    }

    // extrae el schema y el nombre del objeto para la recuperacion de IDs e inyectar los IDs de los objetos en el response
    const objects = data.map(row => ({ schema: row.schema, name: row.objectName }))
    const objectIds = await this.sysobjectRepository.findIDsByNameAndSchema(objects)

    // the port contract promises one id per object, but a broken adapter must fail loud instead of assigning undefined
    if (objectIds.length !== objects.length) {
      throw new SysobjectIdsInconsistencyException(objects.length, objectIds.length)
    }

    const newData = data.map((row, index) => ({
      ...row,
      objectId: objectIds[index],
    }))

    this.logger.info('[favorito] Favoritos obtenidos', {
      actionDetails: {
        userId: filter.idUser,
        type: filter.type,
        count: newData.length,
        total: meta.total,
        limit: meta.limit,
      },
    })

    return { data: newData, meta }
  }
}
