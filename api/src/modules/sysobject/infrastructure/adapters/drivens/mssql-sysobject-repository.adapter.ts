import { MSSQLDatabaseConnection } from '@core/store'
import { buildStoreAuthContext, wrapDatabaseError } from '@core/utils'
import { convertLocalToUTC } from '@core/utils'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { SearchSysObject } from '@sysobject/domain/ports/drivers/for-sysobject-retrieval.port'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import { SysObject } from '@sysobject/domain/schemas/sysobject'
import sql from 'mssql'

import { TIMEZONE_DATABASE } from '@/config/enviroment'

export class MssqlSysObjectRepositoryAdapter implements ForSysObjectRepositoryPort {
  private connection = new MSSQLDatabaseConnection()

  async getById(id: number): Promise<SysObject | null> {
    const { store } = await buildStoreAuthContext()

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const stmt = `
        SELECT
          A.object_id,
          A.name,
          A.type,
          A.type_desc,
          B.schema_id,
          B.name AS schema_name,
          A.create_date,
          A.modify_date,
          C.definition
        FROM sys.objects            A
        INNER JOIN sys.schemas      B ON B.schema_id = A.schema_id
        INNER JOIN sys.sql_modules  C ON C.object_id = A.object_id
        WHERE type IN('P','FN','TR','TF', 'IF', 'V')
          AND A.object_id = @id
      `

      request.input('id', sql.Int, id)
      const res = await request.query(stmt)

      if (res && res.rowsAffected[0] === 0) return null

      // adapter
      const data: SysObject = {
        id: res.recordset[0].object_id,
        name: res.recordset[0].name,
        type: res.recordset[0].type.trim(),
        typeDesc: res.recordset[0].type_desc,
        schemaId: res.recordset[0].schema_id,
        schemaName: res.recordset[0].schema_name,
        createDate: convertLocalToUTC(res.recordset[0].create_date, TIMEZONE_DATABASE), // sql server devuelve zona horaria local
        modifyDate: convertLocalToUTC(res.recordset[0].modify_date, TIMEZONE_DATABASE), // sql server devuelve zona horaria local
        definition: res.recordset[0].definition,
      }

      return data
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async getRolesById(id: number): Promise<PermissionRol[]> {
    const { store } = await buildStoreAuthContext()

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const stmt = `
        SELECT 
          A.state_desc,
          A.permission_name, 
          C.name AS rol
        FROM sys.database_permissions		    A
        INNER JOIN sys.objects				      B ON B.object_id = A.major_id
        INNER JOIN sys.database_principals	C ON C.principal_id = A.grantee_principal_id
        WHERE B.object_id = @id
      `
      request.input('id', sql.Int, id)
      const res = await request.query(stmt)

      const roles: PermissionRol[] =
        res.recordset.map((obj): PermissionRol => {
          return {
            stateDesc: obj.state_desc,
            permissionName: obj.permission_name,
            name: obj.rol,
          }
        }) ?? []

      return roles
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async findByNameAndType(name: string, type: string): Promise<SearchSysObject[]> {
    const { store } = await buildStoreAuthContext()

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const stmt = `
        SELECT TOP 100
          object_id,
          name,
          SCHEMA_NAME(schema_id) AS schema_name,
          type_desc,
          CASE 
            WHEN name LIKE CONCAT(@name, '%') THEN 1
            WHEN name LIKE CONCAT('%', @name, '%') THEN 2
            ELSE 3
          END AS peso
        FROM sys.objects
        WHERE name LIKE CONCAT('%', @name, '%') AND type IN(${type})
        ORDER BY peso,name
      `

      request.input('name', sql.VarChar(128), name)
      const res = await request.query(stmt)

      // adapter
      const data =
        res.recordset.map((obj): SearchSysObject => {
          return {
            id: obj.object_id,
            name: obj.name,
            schemaName: obj.schema_name,
            typeDesc: obj.type_desc.trim(),
          }
        }) ?? []

      return data
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
