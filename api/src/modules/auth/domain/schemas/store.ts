/**
 * Representa la información básica de una base de datos, incluyendo su nombre,
 * compatibilidad, descripción y detalles sobre el servidor en el que está alojada.
 */
export interface StoreInfo {
  /** Nombre de la base de datos. */
  name: string

  /** Versión de compatibilidad. */
  compatibility: string

  /** Descripción general de la base de datos */
  description: string | null

  /** Nombre o dirección del servidor donde se encuentra alojada la base de datos. */
  server: string

  /** Nombre de la base de datos de producción usada para comparación. */
  prodDatabase: string
}

/**
 * Representa la información relacionada con los permisos de un usuario en el sistema.
 */
export interface PermissionStore {
  /** Bandera para comprobar si el usuario tiene acceso de tipo VIEW DEFINITION (puede fallar si la BD es vacía o no tiene objetos de definición SQL). */
  viewdefinitionPermission: boolean
}
