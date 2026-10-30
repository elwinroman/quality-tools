import { DatabaseName, getStaticDatabaseCredentials } from '@core/store'
import { MSSQLExecutor } from '@core/store/mssql-query-runner'
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
  private db = getStaticDatabaseCredentials(DatabaseName.PREPROD)

  constructor(private readonly executor: MSSQLExecutor) {}

  async getByNameAndSchema(name: string, schema: string): Promise<SysObject | null> {
    const res = await this.executor.execute({
      credentials: this.db.credentials,
      userType: this.db.type,
      procedure: 'SYS_ObtenerDefinicionSQL_SP',
      parameters: [
        { name: 'object_name', type: sql.VarChar(128), value: name },
        { name: 'schema_name', type: sql.VarChar(64), value: schema },
      ],
    })

    const row = decodeRow(res.recordset, ProdSysObjectRowSchema)

    if (!row) return null

    return prodSysObjectRowMapper(row)
  }

  async getRolesById(id: number): Promise<PermissionRol[]> {
    const res = await this.executor.execute({
      credentials: this.db.credentials,
      userType: this.db.type,
      procedure: 'SYS_ObtenerRoles_SP',
      parameters: [{ name: 'id', type: sql.Int, value: id }],
    })

    return decodeRows(res.recordset, ProdPermissionRolRowSchema).map(prodPermissionRolRowMapper)
  }
}
