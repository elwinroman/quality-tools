import { ForBusquedaRecienteRepositoryPort } from '@busqueda-reciente/domain/ports/drivens/for-busqueda-reciente-repository.port'
import { BusquedaRecienteInput } from '@busqueda-reciente/domain/schemas/busqueda-reciente'
import { Logger } from '@observability/domain/logger'

export class RegisterBusquedaRecienteUseCase {
  constructor(
    private readonly busquedaRecienteRepository: ForBusquedaRecienteRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(busquedaRecienteInput: BusquedaRecienteInput): Promise<void> {
    const registeredBusquedaReciente = await this.busquedaRecienteRepository.createOrUpdate(busquedaRecienteInput)

    if (!registeredBusquedaReciente) throw new Error('Error al insertar o updatear una búsqueda reciente')

    this.logger.info('[busqueda-reciente] Búsqueda reciente registrada', {
      actionDetails: {
        userId: busquedaRecienteInput.idUser,
        database: busquedaRecienteInput.database,
        schema: busquedaRecienteInput.schema,
        objectName: busquedaRecienteInput.objectName,
        type: busquedaRecienteInput.type,
      },
    })
  }
}
