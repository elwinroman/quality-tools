import type { StoreUserSchema } from '@shared/domain/store'
import type { ConnectionPool } from 'mssql'

import type { UserType } from './mssql-database-connection'

/**
 * Contrato interno de infraestructura que expresa lo que los adaptadores necesitan
 * de una conexión MSSQL: obtener el pool asociado a unas credenciales.
 *
 * NO es un puerto de aplicación: vive en `core/store` porque solo los adaptadores de
 * infraestructura y las raíces de composición dependen de él. Existe para poder inyectar
 * una implementación compartida y para permitir un doble de test sin instanciar la clase
 * concreta (cuyo campo `pools` privado la vuelve nominal en TypeScript).
 *
 * Hoy `connect` devuelve el `ConnectionPool` de `mssql`; eliminar ese tipo queda para el
 * `MSSQLQueryRunner` (ver TODO en `mssql-database-connection.ts`).
 */
export interface MSSQLConnection {
  /** Obtiene (o crea) el pool asociado a las credenciales y tipo de usuario. */
  connect(config: StoreUserSchema, userType: UserType): Promise<ConnectionPool>
}
