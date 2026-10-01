import type { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import type { MSSQLExecutor } from '@core/store/mssql-query-runner'
import { decodeRows } from '@core/utils/decode-recordset.util'
import sql from 'mssql'

import { sysobjectIdRowMapper, SysObjectIdRowSchema } from './sysobject-id.mapper'

/**
 * Entrada del lookup: cualquier objeto identificado por esquema y nombre.
 * Es estructuralmente compatible con el `SysObject` de cada contexto sin acoplarse a ninguno,
 * porque un contexto no debe depender del dominio del otro.
 */
export interface SysObjectIdentifier {
  schema: string
  name: string
}

/**
 * Contrato compartido del repositorio que resuelve IDs de objetos por esquema y nombre.
 * Cada contexto conserva su propio puerto de dominio; este adaptador satisface a ambos
 * por compatibilidad estructural.
 */
export interface ForSysObjectIdRepositoryPort {
  findIDsByNameAndSchema(objects: SysObjectIdentifier[]): Promise<(number | null)[]>
}

export class MssqlSysObjectIdRepositoryAdapter implements ForSysObjectIdRepositoryPort {
  constructor(
    private readonly executor: MSSQLExecutor,
    private readonly currentStoreContextResolver: CurrentStoreContextResolver,
  ) {}

  async findIDsByNameAndSchema(sysObjects: SysObjectIdentifier[]): Promise<(number | null)[]> {
    // con cero objetos no hay nada que resolver: se evita abrir conexión y el lote `VALUES ;` inválido
    if (sysObjects.length === 0) return []

    const { store } = await this.currentStoreContextResolver.resolve()

    // el arreglo completo viaja como UN solo parámetro JSON: sin interpolación de SQL y sin el
    // tope de 2100 parámetros de SQL Server, que rompería a un usuario con muchos favoritos
    const payload = sysObjects.map((row, index) => ({ id: index, schema: row.schema, name: row.name }))

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
    const res = await this.executor.query({
      credentials: store.credentials,
      userType: store.type,
      statement: stmt,
      parameters: [{ name: 'objects', type: sql.NVarChar(sql.MAX), value: JSON.stringify(payload) }],
    })

    return decodeRows(res.recordset, SysObjectIdRowSchema).map(sysobjectIdRowMapper)
  }
}
