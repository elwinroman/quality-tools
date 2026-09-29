import type { MSSQLConnection } from './mssql-connection'
import { MSSQLDatabaseConnection } from './mssql-database-connection'

/**
 * Instancia única de conexión MSSQL para todo el proceso.
 *
 * Las raíces de composición inyectan esta misma instancia en todos los adaptadores, de modo
 * que el caché de pools no se duplique por adaptador: con credenciales iguales, todos
 * comparten un único pool. Se expone como `MSSQLConnection` para que los adaptadores dependan
 * del contrato y no de la clase concreta.
 */
export const mssqlConnection: MSSQLConnection = new MSSQLDatabaseConnection()
