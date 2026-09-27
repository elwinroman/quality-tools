import { BaseSysObjectType } from '@/models/sysobject'

export interface BusquedaReciente {
  id: string
  schema: string
  objectName: string
  type: BaseSysObjectType
  date: string | Date
  /** ID del objeto SQL; `null` cuando el objeto ya no existe en la base */
  objectId: number | null
}
