import { ForBusquedaRecienteRepositoryPort } from '@busqueda-reciente/domain/ports/drivens/for-busqueda-reciente-repository.port'
import { ForSysObjectRepositoryPort } from '@busqueda-reciente/domain/ports/drivens/for-sysobject-repository.port'
import { BusquedaRecienteFilter, BusquedaRecienteResponse } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { SysobjectIdsInconsistencyException } from '@core/exceptions/store/sysobject-ids-inconsistency.exception'
import { Logger } from '@observability/domain/logger'
import { Meta } from '@shared/domain/schemas/meta'

export class GetAllBusquedasRecientesUseCase {
  constructor(
    private readonly repository: ForBusquedaRecienteRepositoryPort,
    private readonly sysobjectRepository: ForSysObjectRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(filter: BusquedaRecienteFilter, limit: number): Promise<{ data: BusquedaRecienteResponse[]; meta: Meta }> {
    const { data, meta } = await this.repository.findMany(filter, limit)

    if (data.length === 0) {
      this.logger.info('[busqueda-reciente] Búsquedas recientes obtenidas', {
        actionDetails: {
          userId: filter.idUser,
          database: filter.database,
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

    // el contrato del puerto promete un id por objeto, pero un adaptador roto debe fallar de forma visible en lugar de asignar undefined
    if (objectIds.length !== objects.length) {
      throw new SysobjectIdsInconsistencyException(objects.length, objectIds.length)
    }

    const newData = data.map((row, index) => ({
      ...row,
      objectId: objectIds[index],
    }))

    this.logger.info('[busqueda-reciente] Búsquedas recientes obtenidas', {
      actionDetails: {
        userId: filter.idUser,
        database: filter.database,
        type: filter.type,
        count: newData.length,
        total: meta.total,
        limit: meta.limit,
      },
    })

    return { data: newData, meta }
  }
}
