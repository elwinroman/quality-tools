import { Logger } from '@observability/domain/logger'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SysObjectDependency, SysObjectRelationsResult } from '@sysobject/domain/schemas/sysobject'

/**
 * Recupera los objetos usados por el objeto consultado.
 */
export class GetSysObjectDependenciesUseCase {
  constructor(
    private readonly sysObjectRepository: ForSysObjectRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(name: string, schema: string): Promise<SysObjectRelationsResult<SysObjectDependency>> {
    const result = await this.sysObjectRepository.findDependenciesBySchemaAndName(name, schema)

    if (result.meta?.warning) {
      this.logger.warn('[sysobject] Fallback aplicado al recuperar dependencias', {
        actionDetails: {
          objectName: name,
          schema,
          warning: result.meta.warning,
        },
      })
    }

    this.logger.info('[sysobject] Dependencias de objeto recuperadas', {
      actionDetails: {
        objectName: name,
        schema,
        resultsCount: result.data.length,
      },
    })

    return result
  }
}
