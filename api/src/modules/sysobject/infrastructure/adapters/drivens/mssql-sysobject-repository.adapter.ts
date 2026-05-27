import { MSSQLDatabaseConnection } from '@core/store'
import { buildStoreAuthContext, wrapDatabaseError } from '@core/utils'
import { convertLocalToUTC } from '@core/utils'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import {
  SysObject,
  SysObjectDependency,
  SysObjectDependent,
  SysObjectSummary,
  ValidTypeSysObject,
} from '@sysobject/domain/schemas/sysobject'
import sql from 'mssql'

import { TIMEZONE_DATABASE } from '@/config/enviroment'

type SysObjectRelationRow = {
  object_id: number | null
  schema_name: string | null
  object_name: string
  type_desc: string | null
}

export class MssqlSysObjectRepositoryAdapter implements ForSysObjectRepositoryPort {
  private connection = new MSSQLDatabaseConnection()

  private isIncompleteDependencyMetadataError(err: unknown): boolean {
    if (!(err instanceof Error)) return false

    const requestError = err as sql.RequestError

    return (
      requestError.number === 2020 ||
      err.message.includes('The dependencies reported for entity') ||
      err.message.includes('might not include references to all columns')
    )
  }

  async getBySchemaAndName(schema: string, name: string): Promise<SysObject | null> {
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
          AND B.name = @schema
          AND A.name = @name
      `

      request.input('schema', sql.VarChar(128), schema)
      request.input('name', sql.VarChar(128), name)
      const res = await request.query(stmt)

      if (res && res.rowsAffected[0] === 0) return null

      const data: SysObject = {
        id: res.recordset[0].object_id,
        name: res.recordset[0].name,
        type: res.recordset[0].type.trim(),
        typeDesc: res.recordset[0].type_desc,
        schemaId: res.recordset[0].schema_id,
        schemaName: res.recordset[0].schema_name,
        createDate: convertLocalToUTC(res.recordset[0].create_date, TIMEZONE_DATABASE),
        modifyDate: convertLocalToUTC(res.recordset[0].modify_date, TIMEZONE_DATABASE),
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

  async findByNameAndType(name: string, types: ValidTypeSysObject[]): Promise<SysObjectSummary[]> {
    const { store } = await buildStoreAuthContext()

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()
      const typeParams = types.map((type, index) => {
        const param = `type${index}`
        request.input(param, sql.VarChar(2), type)
        return `@${param}`
      })

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
        WHERE name LIKE CONCAT('%', @name, '%') AND type IN(${typeParams.join(', ')})
        ORDER BY peso,name
      `

      request.input('name', sql.VarChar(128), name)
      const res = await request.query(stmt)

      // adapter
      const data =
        res.recordset.map((obj): SysObjectSummary => {
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

  async findDependentsBySchemaAndName(name: string, schema: string): Promise<SysObjectDependent[]> {
    const { store } = await buildStoreAuthContext()

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const fullName = `${schema}.${name}`
      const stmt = `
        SELECT
          A.referencing_id object_id,
          COALESCE(A.referencing_schema_name, SCHEMA_NAME(B.schema_id)) schema_name,
          COALESCE(A.referencing_entity_name, B.name) object_name,
          B.type_desc
        FROM sys.dm_sql_referencing_entities (
          @fullName,
          'OBJECT'
        ) AS A
        LEFT JOIN sys.objects AS B
          ON B.object_id = A.referencing_id
        ORDER BY
          schema_name,
          object_name
      `

      request.input('fullName', sql.VarChar(192), fullName)
      let res: sql.IResult<SysObjectRelationRow>

      try {
        res = await request.query(stmt)
      } catch (err) {
        if (!this.isIncompleteDependencyMetadataError(err)) throw err

        const fallbackRequest = conn.request()
        const fallbackStmt = `
          SELECT DISTINCT
            A.referencing_id object_id,
            SCHEMA_NAME(B.schema_id) schema_name,
            B.name object_name,
            B.type_desc
          FROM sys.sql_expression_dependencies A
          INNER JOIN sys.objects B
            ON B.object_id = A.referencing_id
          WHERE
            A.referenced_id = OBJECT_ID(@fullName)
            OR (
              A.referenced_schema_name = @schema
              AND A.referenced_entity_name = @name
            )
          ORDER BY
            schema_name,
            object_name
        `

        fallbackRequest.input('fullName', sql.VarChar(192), fullName)
        fallbackRequest.input('schema', sql.VarChar(128), schema)
        fallbackRequest.input('name', sql.VarChar(128), name)
        res = await fallbackRequest.query(fallbackStmt)
      }

      // adapter
      const data =
        res.recordset.map((obj): SysObjectDependent => {
          return {
            id: obj.object_id,
            name: obj.object_name,
            schemaName: obj.schema_name,
            typeDesc: obj.type_desc?.trim() ?? '',
          }
        }) ?? []

      return data
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async findDependenciesBySchemaAndName(name: string, schema: string): Promise<SysObjectDependency[]> {
    const { store } = await buildStoreAuthContext()

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const fullName = `${schema}.${name}`
      const stmt = `
        SELECT
          A.referenced_id object_id,
          COALESCE(A.referenced_schema_name, SCHEMA_NAME(B.schema_id)) schema_name,
          COALESCE(A.referenced_entity_name, B.name) object_name,
          B.type_desc
        FROM sys.dm_sql_referenced_entities (
          @fullName,
          'OBJECT'
        ) A
        LEFT JOIN sys.objects B
          ON B.object_id = A.referenced_id
        WHERE A.referenced_minor_id = 0
        ORDER BY
          schema_name,
          object_name
      `

      request.input('fullName', sql.VarChar(192), fullName)
      let res: sql.IResult<SysObjectRelationRow>

      try {
        res = await request.query(stmt)
      } catch (err) {
        if (!this.isIncompleteDependencyMetadataError(err)) throw err

        const fallbackRequest = conn.request()
        const fallbackStmt = `
          SELECT DISTINCT
            A.referenced_id object_id,
            COALESCE(A.referenced_schema_name, SCHEMA_NAME(B.schema_id)) schema_name,
            COALESCE(A.referenced_entity_name, B.name) object_name,
            B.type_desc
          FROM sys.sql_expression_dependencies A
          LEFT JOIN sys.objects B
            ON B.object_id = A.referenced_id
          WHERE
            A.referencing_id = OBJECT_ID(@fullName)
            AND ISNULL(A.referenced_minor_id, 0) = 0
          ORDER BY
            schema_name,
            object_name
        `

        fallbackRequest.input('fullName', sql.VarChar(192), fullName)
        res = await fallbackRequest.query(fallbackStmt)
      }

      const data =
        res.recordset.map((obj): SysObjectDependency => {
          return {
            id: obj.object_id,
            name: obj.object_name,
            schemaName: obj.schema_name,
            typeDesc: obj.type_desc?.trim() ?? '',
          }
        }) ?? []

      return data
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
