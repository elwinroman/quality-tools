import { SysObjectRelation } from '../sysobject'

export interface SysObjectRelationsApiResponse {
  correlationId: string
  meta?: {
    warning?: {
      type: 'DependencyMetadataFallback'
      detail: string
      source: 'sys.dm_sql_referenced_entities' | 'sys.dm_sql_referencing_entities'
      fallbackSource: 'sys.sql_expression_dependencies'
    }
  }
  data: SysObjectRelation[]
}
