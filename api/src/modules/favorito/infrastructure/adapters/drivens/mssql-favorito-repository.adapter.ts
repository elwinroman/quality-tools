import { DatabaseName, getStaticDatabaseCredentials } from '@core/store'
import { MSSQLConnection } from '@core/store/mssql-connection'
import { wrapDatabaseError } from '@core/utils'
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

  constructor(private readonly connection: MSSQLConnection) {}

  async createOrUpdate(favoritoRepoInput: FavoritoRepoInput): Promise<{ data: FavoritoRepoResponse } | null> {
    try {
      const conn = await this.connection.connect(this.db.credentials, this.db.type)
      const request = conn.request()

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
      request.input('idUser', sql.Int, favoritoRepoInput.idUser)
      request.input('schema', sql.VarChar(64), favoritoRepoInput.schema)
      request.input('objectName', sql.VarChar(128), favoritoRepoInput.objectName)
      request.input('type', sql.Char(2), favoritoRepoInput.type)
      request.input('date', sql.DateTime, favoritoRepoInput.date)
      request.input('isActive', sql.Bit, favoritoRepoInput.isActive)

      const res = await request.query<FavoritoRow>(stmt)

      // sin fila no hay nada que desactivar: es o-op legítimo
      const favoritoRow = decodeRow(res.recordset, FavoritoRowSchema)

      if (!favoritoRow) return null

      return { data: favoritoRowMapper(favoritoRow) }
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async findMany(filter: FavoritoFilterRepo, limit: number): Promise<{ data: FavoritoRepoResponse[]; meta: Meta }> {
    try {
      const conn = await this.connection.connect(this.db.credentials, this.db.type)
      const request = conn.request()

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
            AND cType     IN (${filter.type})
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
      request.input('idUser', sql.Int, filter.idUser)
      request.input('limit', sql.Int, limit)

      const res = await request.query<FavoritoListRow>(stmt)
      const rows = decodeRows(res.recordset, FavoritoListRowSchema)
      const data = rows.map(row => favoritoRowMapper(row))

      const meta = {
        total: rows[0]?.nTotal ?? 0,
        limit,
      }
      return { data, meta }
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }

  async getById(id: number): Promise<Favorito | null> {
    try {
      const conn = await this.connection.connect(this.db.credentials, this.db.type)
      const request = conn.request()

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
      request.input('id', sql.Int, id)

      const res = await request.query<FavoritoEntityRow>(stmt)

      const row = decodeRow(res.recordset, FavoritoEntityRowSchema)

      if (!row) return null

      return favoritoEntityRowMapper(row)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
