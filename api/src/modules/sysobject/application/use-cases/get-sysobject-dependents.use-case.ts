import { Logger } from '@observability/domain/logger'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SysObjectDependent, SysObjectRelationsResult } from '@sysobject/domain/schemas/sysobject'

/**
 * Recupera los procedimientos, funciones, vistas y demás objetos
 * que referencian el objeto consultado.
 */
export class GetSysObjectDependentsUseCase {
  constructor(
    private readonly sysObjectRepository: ForSysObjectRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(name: string, schema: string): Promise<SysObjectRelationsResult<SysObjectDependent>> {
    const result = await this.sysObjectRepository.findDependentsBySchemaAndName(name, schema)

    if (result.meta?.warning) {
      this.logger.warn('[sysobject] Fallback aplicado al recuperar referenciados', {
        actionDetails: {
          objectName: name,
          schema,
          warning: result.meta.warning,
        },
      })
    }

    this.logger.info('[sysobject] Referencias al objeto recuperadas', {
      actionDetails: {
        objectName: name,
        schema,
        resultsCount: result.data.length,
      },
    })

    return result
  }
}
