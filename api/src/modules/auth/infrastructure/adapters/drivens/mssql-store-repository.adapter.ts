import { ForStoreRepositoryPort } from '@auth/domain/ports/drivens'
import { PermissionStore, StoreInfo } from '@auth/domain/schemas/store'
import { MSSQLDatabaseConnection } from '@core/store'
import { UserTypeEnum } from '@core/store'
import { wrapDatabaseError } from '@core/utils'
import { StoreUserSchema } from '@shared/domain/store'

import { PREPROD_DBNAME } from '@/config/enviroment'

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

      const data: StoreInfo = {
        name: res.recordset[0].name,
        compatibility: res.recordset[0].cmptlevel,
        description: res.recordset[0].value,
        server: res.recordset[0].server_name,
        prodDatabase: PREPROD_DBNAME,
      }

      return data
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

      const hasPermsViewDefinition: boolean = Boolean(res.recordset[0].viewdefinition_permission)

      const data: PermissionStore = {
        viewdefinitionPermission: hasPermsViewDefinition,
      }
      return data
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

      if (res && res.rowsAffected[0] === 0) return null

      // adapter
      const dbnameList: string[] = res.recordset.map(item => item.name)
      return dbnameList
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
