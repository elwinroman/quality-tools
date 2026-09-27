import { ForStoreRepositoryPort } from '@auth/domain/ports/drivens'
import { PermissionStore, StoreInfo } from '@auth/domain/schemas/store'
import { MSSQLDatabaseConnection } from '@core/store'
import { UserTypeEnum } from '@core/store'
import { wrapDatabaseError } from '@core/utils'
import { decodeRow, decodeRows } from '@core/utils/decode-recordset.util'
import { StoreUserSchema } from '@shared/domain/store'

import { PREPROD_DBNAME } from '@/config/enviroment'

import {
  databaseNameRowMapper,
  DatabaseNameRowSchema,
  storeDetailsRowMapper,
  StoreDetailsRowSchema,
  storePermissionRowMapper,
  StorePermissionRowSchema,
} from './store.mapper'

export class MssqlStoreRepositoryAdapter implements ForStoreRepositoryPort {
  private connection = new MSSQLDatabaseConnection()

  async getDetails(credential: StoreUserSchema): Promise<StoreInfo> {
    try {
      const conn = await this.connection.connect(credential, UserTypeEnum.External)
      const request = conn.request()

      const stmt = `
        SELECT
          name,
          cmptlevel,
          value = (SELECT TOP 1 value FROM sys.extended_properties WHERE class = 0),
          @@SERVERNAME AS server_name
        FROM sys.sysdatabases
        WHERE dbid = DB_ID()
      `
      const res = await request.query(stmt)

      const row = decodeRow(res.recordset, StoreDetailsRowSchema)

      // la consulta siempre devuelve una fila para la base activa
      if (!row) throw new Error('[auth] La consulta de detalles no devolvió filas.')

      return storeDetailsRowMapper(row, PREPROD_DBNAME)
    } catch (err: unknown) {
      throw wrapDatabaseError(err)
    }
  }

  async getPermission(credential: StoreUserSchema): Promise<PermissionStore> {
    try {
      const conn = await this.connection.connect(credential, UserTypeEnum.External)
      const request = conn.request()

      const stmt = `
        SELECT viewdefinition_permission =
          CAST(
              CASE
                  WHEN HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'VIEW DEFINITION') = 1 THEN 1
                  WHEN HAS_PERMS_BY_NAME(SCHEMA_NAME(), 'SCHEMA', 'VIEW DEFINITION') = 1 THEN 1
                  WHEN EXISTS (
                      SELECT 1
                      FROM sys.sql_modules
                      WHERE definition IS NOT NULL
                  ) THEN 1
                  ELSE 0
              END
          AS bit)
      `
      const res = await request.query(stmt)

      const row = decodeRow(res.recordset, StorePermissionRowSchema)

      // la consulta siempre devuelve una fila
      if (!row) throw new Error('[auth] La consulta de permisos no devolvió filas.')

      return storePermissionRowMapper(row)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async getDatabases(credential: StoreUserSchema): Promise<string[] | null> {
    try {
      const conn = await this.connection.connect(credential, UserTypeEnum.External)
      const request = conn.request()

      const stmt = `
        SELECT name
        FROM sys.databases
        WHERE source_database_id IS NULL
          AND name NOT IN ('tempdb', 'model', 'msdb')
        ORDER BY name
      `
      const res = await request.query(stmt)

      const rows = decodeRows(res.recordset, DatabaseNameRowSchema)

      if (rows.length === 0) return null

      return rows.map(databaseNameRowMapper)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
