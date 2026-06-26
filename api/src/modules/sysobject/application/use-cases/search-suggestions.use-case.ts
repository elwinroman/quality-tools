import { Logger } from '@shared/domain/logger'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { resolveTypeSysObjectValues, SysObjectSummary, TypeSysObject } from '@sysobject/domain/schemas/sysobject'

export class SearchSuggestionsUseCase {
  constructor(
    private readonly sysObjectRepository: ForSysObjectRepositoryPort,
    private readonly logger: Logger,
  ) {}

  async execute(name: string, type: TypeSysObject): Promise<SysObjectSummary[]> {
    const types = resolveTypeSysObjectValues(type)
    const suggestions = await this.sysObjectRepository.findByNameAndType(name, types)

    this.logger.info('[sysobject] Resultados de búsqueda de objetos obtenidos', {
      actionDetails: {
        searchTerm: name,
        type,
        resultsCount: suggestions.length,
      },
    })

    return suggestions
  }
}
