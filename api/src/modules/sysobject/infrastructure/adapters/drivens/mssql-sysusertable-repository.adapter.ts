import { MSSQLDatabaseConnection } from '@core/store'
import { buildStoreAuthContext, wrapDatabaseError } from '@core/utils'
import { decodeRow, decodeRows } from '@core/utils/decode-recordset.util'
import { CacheRepository } from '@shared/domain/cache-repository'
import { ForSysUsertableRepositoryPort } from '@sysobject/domain/ports/drivens/for-sysusertable-repository.port'
import { Column, ExtendedProperty, ForeignKey, Index, UsertableSysObject } from '@sysobject/domain/schemas/usertable'
import sql from 'mssql'

import {
  columnExtendedPropertyRowMapper,
  ColumnExtendedPropertyRowSchema,
  columnRowMapper,
  ColumnRowSchema,
  foreignKeyRowMapper,
  ForeignKeyRowSchema,
  indexRowMapper,
  IndexRowSchema,
  usertableExtendedPropertyRowMapper,
  UsertableExtendedPropertyRowSchema,
  usertableSysObjectRowMapper,
  UsertableSysObjectRowSchema,
} from './sysusertable.mapper'

export class MssqlSysUsertableRepositoryAdapter implements ForSysUsertableRepositoryPort {
  private connection = new MSSQLDatabaseConnection()

  constructor(private readonly cacheRepository: CacheRepository) {}

  async getBySchemaAndName(schema: string, name: string): Promise<UsertableSysObject | null> {
    const { store } = await buildStoreAuthContext(this.cacheRepository)

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
          A.modify_date
        FROM sys.objects        A
        INNER JOIN sys.schemas  B ON B.schema_id = A.schema_id
        WHERE type IN('U')
          AND B.name = @schema
          AND A.name = @name
      `

      request.input('schema', sql.VarChar(128), schema)
      request.input('name', sql.VarChar(128), name)
      const res = await request.query(stmt)

      const row = decodeRow(res.recordset, UsertableSysObjectRowSchema)

      if (!row) return null

      return usertableSysObjectRowMapper(row)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async getColumnsById(id: number): Promise<Column[]> {
    const { store } = await buildStoreAuthContext(this.cacheRepository)

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const stmt = `
        --======================================================================
        -- Obtener columnas => recordset[0]
        --======================================================================
        SELECT
          A.column_id,
          A.name,
          B.name AS type_name,
          A.max_length,
          A.precision,
          A.scale,
          A.is_nullable,
          A.is_identity,
          C.definition AS default_definition
        FROM sys.columns      A
        INNER JOIN sys.types  B ON B.user_type_id = A.user_type_id
        LEFT JOIN sys.default_constraints C ON C.parent_column_id = A.column_id AND C.parent_object_id = @id
        WHERE A.object_id = @id
        ORDER BY A.column_id;
  
        --======================================================================
        -- Obtener propiedades extendidas de las columnas => recordset[1]
        --======================================================================
        SELECT 
          A.column_id,
          CAST(B.value AS NVARCHAR(200)) COLLATE Latin1_General_CI_AS_KS_WS AS value,
          B.name
        FROM sys.columns A
        INNER JOIN sys.extended_properties B ON B.major_id = A.object_id AND B.minor_id = A.column_id
        WHERE B.class = 1 -- (1: OBJECT_OR_COLUMN)
          AND A.object_id = @id
      `
      request.input('id', sql.Int, id)
      const res = await request.query(stmt)

      // el batch devuelve dos recordsets; cada uno se valida antes de mapear
      const [columnsRecordset, extendedPropertiesRecordset] = res.recordsets as unknown as [unknown[], unknown[]]

      const columnRows = decodeRows(columnsRecordset, ColumnRowSchema)
      const extendedPropertyRows = decodeRows(extendedPropertiesRecordset, ColumnExtendedPropertyRowSchema)

      return columnRows.map(row =>
        columnRowMapper(row, extendedPropertyRows.filter(prop => prop.column_id === row.column_id).map(columnExtendedPropertyRowMapper)),
      )
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async getForeignKeysById(id: number): Promise<ForeignKey[]> {
    const { store } = await buildStoreAuthContext(this.cacheRepository)

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const stmt = `
        SELECT 
          A.column_id,
          SCHEMA_NAME(C.schema_id) AS referenced_schema,
          B.referenced_object_id,
          C.name AS referenced_object,
          B.referenced_column_id,
          D.name AS referenced_column
        FROM sys.columns A
        INNER JOIN sys.foreign_key_columns	B ON B.parent_column_id = A.column_id AND B.parent_object_id = A.object_id
        INNER JOIN sys.objects				      C ON C.object_id = B.referenced_object_id
        INNER JOIN sys.columns				      D ON D.column_id = B.referenced_column_id AND D.object_id = B.referenced_object_id
        WHERE A.object_id = ${id}
      `
      request.input('id', sql.Int, id)
      const res = await request.query(stmt)

      return decodeRows(res.recordset, ForeignKeyRowSchema).map(foreignKeyRowMapper)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async getIndexesById(id: number): Promise<Index[]> {
    const { store } = await buildStoreAuthContext(this.cacheRepository)

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const stmt = `
        SELECT
          C.name           AS index_name,
          C.type_desc,
          C.is_primary_key,
          C.is_unique,
          C.has_filter     AS is_filtered,
          C.filter_definition,
          A.column_id,
          A.name           AS column_name,
          B.key_ordinal,
          B.is_descending_key,
          B.is_included_column,
          C.is_disabled
        FROM sys.columns              A
        INNER JOIN sys.index_columns  B ON B.column_id = A.column_id AND B.object_id = A.object_id
        INNER JOIN sys.indexes        C ON C.index_id = B.index_id AND C.object_id = A.object_id
        WHERE A.object_id = @id
        ORDER BY C.name, B.key_ordinal
      `
      request.input('id', sql.Int, id)
      const res = await request.query(stmt)

      const indexMap = new Map<string, Index>()

      for (const index of decodeRows(res.recordset, IndexRowSchema).map(indexRowMapper)) {
        const existing = indexMap.get(index.name)

        if (existing) {
          existing.columns.push(...index.columns)
          continue
        }

        indexMap.set(index.name, index)
      }

      return [...indexMap.values()]
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async getUsertableExtendedPropertieById(id: number): Promise<ExtendedProperty[]> {
    const { store } = await buildStoreAuthContext(this.cacheRepository)

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const stmt = `
        SELECT 
          CAST(value AS NVARCHAR(200)) COLLATE Latin1_General_CI_AS_KS_WS AS value, 
          name 
        FROM sys.extended_properties
        WHERE major_id = @id AND minor_id = 0
      `
      request.input('id', sql.Int, id)
      const res = await request.query(stmt)

      return decodeRows(res.recordset, UsertableExtendedPropertyRowSchema).map(usertableExtendedPropertyRowMapper)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
