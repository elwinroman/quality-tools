/**
 * Representa a un usuario autenticado dentro del sistema,
 * incluyendo su información básica, token de autenticación
 * y detalles del entorno de base de datos al que tiene acceso.
 */
export interface AuthenticatedUser {
  /** Identificador numérico único del usuario. */
  idUser: number

  /** Nombre de usuario utilizado para autenticarse. */
  username: string

  /** Nombre o alias del host asociado a la sesión del usuario. */
  originalServer: string

  /** Token de acceso utilizado para autenticar solicitudes del usuario. */
  token: string

  databaseInfo: {
    /** Nombre de la base de datos. */
    name: string

    /** Versión de compatibilidad. */
    compatibility: number

    /** Descripción general de la base de datos */
    description: string

    /** Nombre o dirección del servidor donde se encuentra alojada la base de datos. */
    server: string

    /** Nombre de la base de datos de pre-producción usada para comparación. */
    prodDatabase: string
  }
}
