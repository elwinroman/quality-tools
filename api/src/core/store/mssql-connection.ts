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
 * `connect` conserva `ConnectionPool` porque el runner y los adaptadores todavía usan los
 * tipos de parámetros y resultados de `mssql`; abstraerlos requiere un contrato separado.
 */
export interface MSSQLConnection {
  /** Obtiene (o crea) el pool asociado a las credenciales y tipo de usuario. */
  connect(config: StoreUserSchema, userType: UserType): Promise<ConnectionPool>
}
