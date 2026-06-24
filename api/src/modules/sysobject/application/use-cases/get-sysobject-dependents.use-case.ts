import { Logger } from '@shared/domain/logger'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SysObjectDependent, SysObjectRelationsResult } from '@sysobject/domain/schemas/sysobject'

/**
 * Recupera los objetos que dependen del objeto consultado.
 */
export class GetSysObjectDependentsUseCase {
  constructor(
    private readonly sysObjectRepository: ForSysObjectRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(name: string, schema: string): Promise<SysObjectRelationsResult<SysObjectDependent>> {
    const result = await this.sysObjectRepository.findDependentsBySchemaAndName(name, schema)

    if (result.meta?.warning) {
      this.logger.warn('[sysobject] Fallback aplicado al recuperar dependientes', {
        actionDetails: {
          objectName: name,
          schema,
          warning: result.meta.warning,
        },
      })
    }

    this.logger.info('[sysobject] Dependientes de objeto recuperados', {
      actionDetails: {
        objectName: name,
        schema,
        resultsCount: result.data.length,
      },
    })

    return result
  }
}
