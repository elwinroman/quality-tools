import { DatabaseName, getStaticDatabaseCredentials } from '@core/store'
import { MSSQLExecutor, MSSQLParameter } from '@core/store/mssql-query-runner'
import { decodeRow, decodeRows } from '@core/utils/decode-recordset.util'
import { ForFavoritoRepositoryPort } from '@favorito/domain/ports/drivens/for-favorito-repository.port'
import { Favorito, FavoritoFilterRepo, FavoritoRepoInput, FavoritoRepoResponse } from '@favorito/domain/schemas/favorito'
import { Meta } from '@shared/domain/schemas/meta'
import sql from 'mssql'

import {
  FavoritoEntityRow,
  favoritoEntityRowMapper,
  FavoritoEntityRowSchema,
  FavoritoListRow,
  FavoritoListRowSchema,
  FavoritoRow,
  favoritoRowMapper,
  FavoritoRowSchema,
} from './favorito.mapper'

export class MSSQLFavoritoRepositoryAdapter implements ForFavoritoRepositoryPort {
  private db = getStaticDatabaseCredentials(DatabaseName.APP)

  constructor(private readonly executor: MSSQLExecutor) {}

  async createOrUpdate(favoritoRepoInput: FavoritoRepoInput): Promise<{ data: FavoritoRepoResponse } | null> {
    const stmt = `
        SET NOCOUNT ON;

        /********************************************************************
          UPDLOCK + HOLDLOCK: HOLDLOCK (SERIALIZABLE) toma un lock de
          rango sobre la clave, así que el request perdedor espera en
          lugar de insertar un duplicado. UPDLOCK evita el deadlock de
          conversión clásico. Necesita el índice único para que el lock
          sea por rango y no a nivel tabla.
        *********************************************************************/

        UPDATE dbo.Favorito WITH (UPDLOCK, HOLDLOCK)
           SET cType    = @type,
               dFecha   = @date,
               lVigente = @isActive
         WHERE idUsuario     = @idUser
           AND cSchema       = @schema
           AND cNombreObjeto = @objectName;

        -- Inserta cuando no exista el registro y sea válido su activación
        IF @@ROWCOUNT = 0 AND @isActive = 1
          INSERT INTO dbo.Favorito (idUsuario, cSchema, cNombreObjeto, cType, dFecha, lVigente)
          VALUES (@idUser, @schema, @objectName, @type, @date, @isActive);

        -- Devuelve la fila tal como quedó persistida
        SELECT
          idFavorito,
          cSchema,
          cNombreObjeto,
          cType,
          dFecha,
          lVigente
        FROM dbo.Favorito
        WHERE idUsuario     = @idUser
          AND cSchema       = @schema
          AND cNombreObjeto = @objectName;
      `
    const res = await this.executor.query<FavoritoRow>({
      credentials: this.db.credentials,
      userType: this.db.type,
      statement: stmt,
      parameters: [
        { name: 'idUser', type: sql.Int, value: favoritoRepoInput.idUser },
        { name: 'schema', type: sql.VarChar(64), value: favoritoRepoInput.schema },
        { name: 'objectName', type: sql.VarChar(128), value: favoritoRepoInput.objectName },
        { name: 'type', type: sql.Char(2), value: favoritoRepoInput.type },
        { name: 'date', type: sql.DateTime, value: favoritoRepoInput.date },
        { name: 'isActive', type: sql.Bit, value: favoritoRepoInput.isActive },
      ],
    })

    // sin fila no hay nada que desactivar: es o-op legítimo
    const favoritoRow = decodeRow(res.recordset, FavoritoRowSchema)

    if (!favoritoRow) return null

    return { data: favoritoRowMapper(favoritoRow) }
  }

  async findMany(filter: FavoritoFilterRepo, limit: number): Promise<{ data: FavoritoRepoResponse[]; meta: Meta }> {
    // `filter.type` llega como la lista `IN` ya formateada por la capa de aplicación
    // (p. ej. `'V'` o `'P', 'FN'`). Se desarma en sus valores para enlazarlos como
    // parámetros: el texto de la sentencia no debe transportar datos.
    const typeValues = filter.type
      .split(',')
      .map(value => value.trim().replace(/^'(.*)'$/, '$1'))
      .filter(value => value.length > 0)

    // `IN ()` es SQL inválido: sin tipos no hay nada que la consulta pueda devolver.
    if (typeValues.length === 0) {
      return { data: [], meta: { total: 0, limit } }
    }

    const parameters: MSSQLParameter[] = [
      { name: 'idUser', type: sql.Int, value: filter.idUser },
      { name: 'limit', type: sql.Int, value: limit },
    ]
    const typePlaceholders = typeValues.map((value, index) => {
      const name = `type${index}`
      parameters.push({ name, type: sql.Char(2), value })
      return `@${name}`
    })

    const stmt = `
        ;WITH FavoritosCTE AS (
          SELECT 
            idFavorito,
            cSchema,
            cNombreObjeto,
            cType,
            dFecha,
            lVigente
          FROM dbo.Favorito
          WHERE idUsuario = @idUser
            AND cType     IN (${typePlaceholders.join(', ')})
            AND lVigente  = 1
        ),
        TotalRegistrosCTE AS (
          SELECT COUNT(*) AS nTotal FROM FavoritosCTE
        )
        SELECT TOP (@limit)
          A.idFavorito,
          A.cSchema,
          A.cNombreObjeto,
          A.cType,
          A.dFecha,
          A.lVigente,
          C.nTotal
        FROM FavoritosCTE A
        CROSS JOIN TotalRegistrosCTE C
        ORDER BY A.dFecha DESC
      `
    const res = await this.executor.query<FavoritoListRow>({
      credentials: this.db.credentials,
      userType: this.db.type,
      statement: stmt,
      parameters,
    })
    const rows = decodeRows(res.recordset, FavoritoListRowSchema)
    const data = rows.map(row => favoritoRowMapper(row))

    const meta = {
      total: rows[0]?.nTotal ?? 0,
      limit,
    }
    return { data, meta }
  }

  async getById(id: number): Promise<Favorito | null> {
    const stmt = `
        SELECT
          idFavorito,
          cSchema,
          cNombreObjeto,
          cType,
          dFecha,
          lVigente,
          idUsuario
        FROM dbo.Favorito
        WHERE idFavorito = @id
      `
    const res = await this.executor.query<FavoritoEntityRow>({
      credentials: this.db.credentials,
      userType: this.db.type,
      statement: stmt,
      parameters: [{ name: 'id', type: sql.Int, value: id }],
    })

    const row = decodeRow(res.recordset, FavoritoEntityRowSchema)

    if (!row) return null

    return favoritoEntityRowMapper(row)
  }
}
