export interface StoreInfo {
  name: string

  compatibility: number

  description: string | null

  server: string

  /** Nombre de la base de datos de producción usada para comparación. */
  prodDatabase: string
}

export interface PermissionStore {
  /** Bandera para comprobar si el usuario tiene acceso de tipo VIEW DEFINITION (puede fallar si la BD es vacía o no tiene objetos de definición SQL). */
  viewdefinitionPermission: boolean
}
