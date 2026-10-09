import type { CurrentStoreContextResolver } from '@auth/domain/ports/drivens/current-store-context-resolver.port'
import type { MSSQLExecutor, MSSQLParameter } from '@core/store/mssql-query-runner'
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

    // Los valores viajan como parámetros enlazados (nunca interpolados). Se arma una tabla `VALUES`
    // en lugar de `OPENJSON ... WITH (...)`: esa construcción producía "Incorrect syntax near '$.id'"
    // en el entorno, así que se evita depender de las funciones JSON. El ordinal conserva el orden de
    // entrada. El tope de 2100 parámetros de SQL Server no se alcanza: la lista que llega acá es corta
    // (2 parámetros por objeto).
    const parameters: MSSQLParameter[] = sysObjects.flatMap((row, index) => [
      { name: `schema${index}`, type: sql.VarChar(255), value: row.schema },
      { name: `name${index}`, type: sql.VarChar(255), value: row.name },
    ])
    const valueRows = sysObjects.map((_, index) => `(${index}, @schema${index}, @name${index})`).join(', ')

    const stmt = `
        SELECT OBJECT_ID(CONCAT(v.schema_name, '.', v.object_name)) AS object_id
        FROM (VALUES ${valueRows}) AS v(ordinal, schema_name, object_name)
        ORDER BY v.ordinal ASC
      `

    // `ORDER BY v.ordinal ASC` sobre el índice de entrada conserva una fila por objeto en el orden original
    const res = await this.executor.query({
      credentials: store.credentials,
      userType: store.type,
      statement: stmt,
      parameters,
    })

    return decodeRows(res.recordset, SysObjectIdRowSchema).map(sysobjectIdRowMapper)
  }
}
