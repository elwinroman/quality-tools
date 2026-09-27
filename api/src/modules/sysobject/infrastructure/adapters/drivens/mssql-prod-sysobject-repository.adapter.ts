import { DatabaseName, getStaticDatabaseCredentials, MSSQLDatabaseConnection } from '@core/store'
import { wrapDatabaseError } from '@core/utils'
import { decodeRow, decodeRows } from '@core/utils/decode-recordset.util'
import { ForProdSysObjectRepositoryPort } from '@sysobject/domain/ports/drivens/for-prod-sysobject-repository.port'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import { SysObject } from '@sysobject/domain/schemas/sysobject'
import sql from 'mssql'

import {
  prodPermissionRolRowMapper,
  ProdPermissionRolRowSchema,
  prodSysObjectRowMapper,
  ProdSysObjectRowSchema,
} from './prod-sysobject.mapper'

export class MssqlProdSysObjectRepositoryAdapter implements ForProdSysObjectRepositoryPort {
  private connection = new MSSQLDatabaseConnection()
  private db = getStaticDatabaseCredentials(DatabaseName.PREPROD)

  async getByNameAndSchema(name: string, schema: string): Promise<SysObject | null> {
    try {
      const conn = await this.connection.connect(this.db.credentials, this.db.type)
      const request = conn.request()

      request.input('object_name', sql.VarChar(128), name).input('schema_name', sql.VarChar(64), schema)
      const res = await request.execute('SYS_ObtenerDefinicionSQL_SP')

      const row = decodeRow(res.recordset, ProdSysObjectRowSchema)

      if (!row) return null

      return prodSysObjectRowMapper(row)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async getRolesById(id: number): Promise<PermissionRol[]> {
    try {
      const conn = await this.connection.connect(this.db.credentials, this.db.type)
      const request = conn.request()

      request.input('id', sql.Int, id)
      const res = await request.execute('SYS_ObtenerRoles_SP')

      return decodeRows(res.recordset, ProdPermissionRolRowSchema).map(prodPermissionRolRowMapper)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
