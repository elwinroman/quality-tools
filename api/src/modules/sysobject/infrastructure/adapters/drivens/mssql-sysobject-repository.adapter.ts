import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { MSSQLExecutor, MSSQLParameter } from '@core/store/mssql-query-runner'
import { decodeRow, decodeRows } from '@core/utils/decode-recordset.util'
import { ForSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysobject-repository.port'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import {
  SysObject,
  SysObjectDependency,
  SysObjectDependent,
  SysObjectRelationsResult,
  SysObjectRelationsWarning,
  SysObjectSummary,
  ValidTypeSysObject,
} from '@sysobject/domain/schemas/sysobject'
import sql from 'mssql'

import { TIMEZONE_DATABASE } from '@/config/enviroment'

import {
  permissionRolRowMapper,
  PermissionRolRowSchema,
  sysObjectRelationRowMapper,
  SysObjectRelationRowSchema,
  sysObjectRowMapper,
  SysObjectRowSchema,
  sysObjectSummaryRowMapper,
  SysObjectSummaryRowSchema,
} from './sysobject.mapper'

export class MssqlSysObjectRepositoryAdapter implements ForSysObjectRepositoryPort {
  constructor(
    private readonly executor: MSSQLExecutor,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
  ) {}

  private isIncompleteDependencyMetadataError(err: unknown): boolean {
    // El ejecutor propaga el error crudo del driver: se inspecciona directamente el request error.
    return err instanceof sql.RequestError && err.number === 2020
  }

  private buildDependencyFallbackWarning(
    err: unknown,
    source: SysObjectRelationsWarning['source'],
    fullName: string,
  ): SysObjectRelationsWarning {
    const detail = err instanceof Error ? err.message : String(err)

    return {
      type: 'DependencyMetadataFallback',
      detail: `[${fullName}] ${detail}`,
      source,
      fallbackSource: 'sys.sql_expression_dependencies',
    }
  }

  async getBySchemaAndName(schema: string, name: string): Promise<SysObject | null> {
    const { store } = await this.currentStoreContextResolver.resolve()

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

    const res = await this.executor.query({
      credentials: store.credentials,
      userType: store.type,
      statement: stmt,
      parameters: [
        { name: 'schema', type: sql.VarChar(128), value: schema },
        { name: 'name', type: sql.VarChar(128), value: name },
      ],
    })

    const row = decodeRow(res.recordset, SysObjectRowSchema)

    if (!row) return null

    return sysObjectRowMapper(row, TIMEZONE_DATABASE)
  }

  async getRolesById(id: number): Promise<PermissionRol[]> {
    const { store } = await this.currentStoreContextResolver.resolve()

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
    const res = await this.executor.query({
      credentials: store.credentials,
      userType: store.type,
      statement: stmt,
      parameters: [{ name: 'id', type: sql.Int, value: id }],
    })

    return decodeRows(res.recordset, PermissionRolRowSchema).map(permissionRolRowMapper)
  }

  async findByNameAndType(name: string, types: ValidTypeSysObject[]): Promise<SysObjectSummary[]> {
    const { store } = await this.currentStoreContextResolver.resolve()

    const parameters: MSSQLParameter[] = []
    const typeParams = types.map((type, index) => {
      const param = `type${index}`
      parameters.push({ name: param, type: sql.VarChar(2), value: type })
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

    parameters.push({ name: 'name', type: sql.VarChar(128), value: name })
    const res = await this.executor.query({ credentials: store.credentials, userType: store.type, statement: stmt, parameters })

    return decodeRows(res.recordset, SysObjectSummaryRowSchema).map(sysObjectSummaryRowMapper)
  }

  async findDependentsBySchemaAndName(name: string, schema: string): Promise<SysObjectRelationsResult<SysObjectDependent>> {
    const { store } = await this.currentStoreContextResolver.resolve()

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

    const parameters = [{ name: 'fullName', type: sql.VarChar(192), value: fullName }]
    let res: sql.IResult<unknown>
    let warning: SysObjectRelationsWarning | undefined
    const getFallbackDependents = async () => {
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

      return this.executor.query<unknown>({
        credentials: store.credentials,
        userType: store.type,
        statement: fallbackStmt,
        parameters: [
          ...parameters,
          { name: 'schema', type: sql.VarChar(128), value: schema },
          { name: 'name', type: sql.VarChar(128), value: name },
        ],
      })
    }

    try {
      res = await this.executor.query({ credentials: store.credentials, userType: store.type, statement: stmt, parameters })
    } catch (err) {
      if (!this.isIncompleteDependencyMetadataError(err)) throw err

      warning = this.buildDependencyFallbackWarning(err, 'sys.dm_sql_referencing_entities', fullName)
      res = await getFallbackDependents()
    }

    const data = decodeRows(res.recordset, SysObjectRelationRowSchema).map(sysObjectRelationRowMapper)

    return warning ? { data, meta: { warning } } : { data }
  }

  async findDependenciesBySchemaAndName(name: string, schema: string): Promise<SysObjectRelationsResult<SysObjectDependency>> {
    const { store } = await this.currentStoreContextResolver.resolve()

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

    const parameters = [{ name: 'fullName', type: sql.VarChar(192), value: fullName }]
    let res: sql.IResult<unknown>
    let warning: SysObjectRelationsWarning | undefined
    const getFallbackDependencies = async () => {
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

      return this.executor.query<unknown>({
        credentials: store.credentials,
        userType: store.type,
        statement: fallbackStmt,
        parameters,
      })
    }

    try {
      res = await this.executor.query({ credentials: store.credentials, userType: store.type, statement: stmt, parameters })
    } catch (err) {
      if (!this.isIncompleteDependencyMetadataError(err)) throw err

      warning = this.buildDependencyFallbackWarning(err, 'sys.dm_sql_referenced_entities', fullName)
      res = await getFallbackDependencies()
    }

    const data = decodeRows(res.recordset, SysObjectRelationRowSchema).map(sysObjectRelationRowMapper)

    return warning ? { data, meta: { warning } } : { data }
  }
}
