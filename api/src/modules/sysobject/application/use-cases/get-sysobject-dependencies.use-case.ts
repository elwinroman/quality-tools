import { Logger } from '@shared/domain/logger'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SysObjectDependency } from '@sysobject/domain/schemas/sysobject'

/**
 * Recupera los objetos usados por el objeto consultado.
 */
export class GetSysObjectDependenciesUseCase {
  constructor(
    private readonly sysObjectRepository: ForSysObjectRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(name: string, schema: string): Promise<SysObjectDependency[]> {
    const dependencies = await this.sysObjectRepository.findDependenciesBySchemaAndName(name, schema)

    this.logger.info('[sysobject] Dependencias de objeto recuperadas', {
      actionDetails: {
        objectName: name,
        schema,
        resultsCount: dependencies.length,
      },
    })

    return dependencies
  }
}
