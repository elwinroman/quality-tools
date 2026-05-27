import { SysObjectRelation } from '../sysobject'

export interface SysObjectRelationsApiResponse {
  correlationId: string
  data: SysObjectRelation[]
}
