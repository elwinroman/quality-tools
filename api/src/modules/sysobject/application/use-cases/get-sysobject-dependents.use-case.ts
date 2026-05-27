import { Logger } from '@shared/domain/logger'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SysObjectDependent } from '@sysobject/domain/schemas/sysobject'

/**
 * Recupera los objetos que dependen del objeto consultado.
 */
export class GetSysObjectDependentsUseCase {
  constructor(
    private readonly sysObjectRepository: ForSysObjectRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(name: string, schema: string): Promise<SysObjectDependent[]> {
    const dependents = await this.sysObjectRepository.findDependentsBySchemaAndName(name, schema)

    this.logger.info('[sysobject] Dependientes de objeto recuperados', {
      actionDetails: {
        objectName: name,
        schema,
        resultsCount: dependents.length,
      },
    })

    return dependents
  }
}
