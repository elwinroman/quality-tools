import { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import { MSSQLConnection } from '@core/store/mssql-connection'
import { decodeRows } from '@core/utils/decode-recordset.util'
import { wrapDatabaseError } from '@core/utils/wrap-database-error.util'
import { ForSysObjectRepositoryPort, SysObject } from '@favorito/domain/ports/drivens/for-sysobject-repository.port'
import sql from 'mssql'

import { sysobjectIdRowMapper, SysObjectIdRowSchema } from './sysobject.mapper'

export class MSSQLSysObjectRepositoryAdapter implements ForSysObjectRepositoryPort {
  constructor(
    private readonly connection: MSSQLConnection,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
  ) {}

  async findIDsByNameAndSchema(sysObjects: SysObject[]): Promise<(number | null)[]> {
    // con cero objetos no hay nada que resolver: se evita abrir conexión y el lote `VALUES ;` inválido
    if (sysObjects.length === 0) return []

    const { store } = await this.currentStoreContextResolver.resolve()

    // el arreglo completo viaja como UN solo parámetro JSON: sin interpolación de SQL y sin el
    // tope de 2100 parámetros de SQL Server, que rompería a un usuario con muchos favoritos
    const payload = sysObjects.map((row, index) => ({ id: index, schema: row.schema, name: row.name }))

    try {
      const conn = await this.connection.connect(store.credentials, store.type)
      const request = conn.request()

      const stmt = `
        SELECT 
          OBJECT_ID(CONCAT(schema_name, '.', object_name)) AS object_id
        FROM OPENJSON(@objects)
        WITH (
          id INT '$.id',
          schema_name VARCHAR(255) '$.schema',
          object_name VARCHAR(255) '$.name'
        )
        ORDER BY id ASC
      `

      // `ORDER BY id ASC` sobre el índice de entrada conserva una fila por objeto en el orden original
      const res = await request.input('objects', sql.NVarChar(sql.MAX), JSON.stringify(payload)).query(stmt)

      return decodeRows(res.recordset, SysObjectIdRowSchema).map(sysobjectIdRowMapper)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
