import { logger } from '@core/logger/pino-instance'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { resolveTypeSysObjectValues, SysObjectSummary, TypeSysObject } from '@sysobject/domain/schemas/sysobject'

export class SearchSuggestionsUseCase {
  constructor(private readonly sysObjectRepository: ForSysObjectRepositoryPort) {}

  async execute(name: string, type: TypeSysObject): Promise<SysObjectSummary[]> {
    const types = resolveTypeSysObjectValues(type)
    const suggestions = await this.sysObjectRepository.findByNameAndType(name, types)

    logger.info('[sysobject] Resultados de búsqueda de objetos obtenidos', {
      actionDetails: {
        searchTerm: name,
        type,
        resultsCount: suggestions.length,
      },
    })

    return suggestions
  }
}
