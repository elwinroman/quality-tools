import type { QueryStoreOptionsContext } from '@/modules/performance/domain/query-store-options'

/** Puerto de lectura de la configuración y los intervalos retenidos de Query Store. */
export interface ForQueryStoreOptionsRepositoryPort {
  findOptionsContext(): Promise<QueryStoreOptionsContext>
}
