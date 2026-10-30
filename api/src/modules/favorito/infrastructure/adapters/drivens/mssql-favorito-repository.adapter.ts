import { DatabaseName, getStaticDatabaseCredentials } from '@core/store'
import { MSSQLExecutor, MSSQLParameter, MSSQLTransactionRunner } from '@core/store/mssql-query-runner'
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

  constructor(
    private readonly executor: MSSQLExecutor,
    private readonly transactionRunner: MSSQLTransactionRunner,
  ) {}

  async createOrUpdate(favoritoRepoInput: FavoritoRepoInput): Promise<{ data: FavoritoRepoResponse } | null> {
    const stmt = `
        SET NOCOUNT ON;

        /********************************************************************
          UPDLOCK + HOLDLOCK: HOLDLOCK (SERIALIZABLE) toma un lock de
          rango sobre la clave, así que el request perdedor espera en
          lugar de insertar un duplicado. UPDLOCK evita el deadlock de
          conversión clásico. Necesita el índice único para que el lock
          sea por rango y no a nivel tabla. Este batch corre dentro de una
          única transacción (ver createOrUpdate) para que los locks cubran
          el find-or-create del alcance y el upsert de Favorito.
        *********************************************************************/

        DECLARE @scopeId INT;

        -- Alcance global: fila reservada id = 0 en dbo.FavoriteScope.
        IF @serverName IS NULL AND @databaseName IS NULL
        BEGIN
          SET @scopeId = 0;
        END
        ELSE
        BEGIN
          -- find-or-create del alcance con los mismos locks que el upsert de Favorito.
          -- Predicados NULL-safe: (col = @p OR (col IS NULL AND @p IS NULL)).
          SELECT @scopeId = FavoriteScopeId
          FROM dbo.FavoriteScope WITH (UPDLOCK, HOLDLOCK)
          WHERE (ServerName   = @serverName   OR (ServerName   IS NULL AND @serverName   IS NULL))
            AND (DatabaseName = @databaseName OR (DatabaseName IS NULL AND @databaseName IS NULL));

          IF @scopeId IS NULL
          BEGIN
            INSERT INTO dbo.FavoriteScope (ServerName, DatabaseName)
            VALUES (@serverName, @databaseName);

            SET @scopeId = SCOPE_IDENTITY();
          END
        END

        UPDATE dbo.Favorito WITH (UPDLOCK, HOLDLOCK)
           SET cType    = @type,
               dFecha   = @date,
               lVigente = @isActive
         WHERE idUsuario       = @idUser
           AND FavoriteScopeId = @scopeId
           AND cSchema         = @schema
           AND cNombreObjeto   = @objectName;

        -- Inserta cuando no exista el registro y sea válido su activación
        IF @@ROWCOUNT = 0 AND @isActive = 1
          INSERT INTO dbo.Favorito (idUsuario, FavoriteScopeId, cSchema, cNombreObjeto, cType, dFecha, lVigente)
          VALUES (@idUser, @scopeId, @schema, @objectName, @type, @date, @isActive);

        -- Devuelve la fila tal como quedó persistida, con su alcance
        SELECT
          f.idFavorito,
          f.cSchema,
          f.cNombreObjeto,
          f.cType,
          f.dFecha,
          f.lVigente,
          f.FavoriteScopeId,
          s.ServerName,
          s.DatabaseName
        FROM dbo.Favorito f
        INNER JOIN dbo.FavoriteScope s ON s.FavoriteScopeId = f.FavoriteScopeId
        WHERE f.idUsuario       = @idUser
          AND f.FavoriteScopeId = @scopeId
          AND f.cSchema         = @schema
          AND f.cNombreObjeto   = @objectName;
      `
    // Todo el batch corre en una transacción: en autocommit el lock de rango de
    // UPDLOCK/HOLDLOCK se suelta entre statements, así que el find-or-create del
    // alcance y el upsert de Favorito no quedarían protegidos juntos.
    return this.transactionRunner.runInTransaction(this.db.credentials, this.db.type, async ({ query }) => {
      const res = await query<FavoritoRow>({
        statement: stmt,
        parameters: [
          { name: 'idUser', type: sql.Int, value: favoritoRepoInput.idUser },
          { name: 'schema', type: sql.VarChar(64), value: favoritoRepoInput.schema },
          { name: 'objectName', type: sql.VarChar(128), value: favoritoRepoInput.objectName },
          { name: 'type', type: sql.Char(2), value: favoritoRepoInput.type },
          { name: 'date', type: sql.DateTime, value: favoritoRepoInput.date },
          { name: 'isActive', type: sql.Bit, value: favoritoRepoInput.isActive },
          { name: 'serverName', type: sql.VarChar(64), value: favoritoRepoInput.scope.serverName },
          { name: 'databaseName', type: sql.VarChar(64), value: favoritoRepoInput.scope.databaseName },
        ],
      })

      // sin fila no hay nada que desactivar: es o-op legítimo
      const favoritoRow = decodeRow(res.recordset, FavoritoRowSchema)

      if (!favoritoRow) return null

      return { data: favoritoRowMapper(favoritoRow) }
    })
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
      { name: 'serverName', type: sql.VarChar(64), value: filter.context.serverName },
      { name: 'databaseName', type: sql.VarChar(64), value: filter.context.databaseName },
    ]
    const typePlaceholders = typeValues.map((value, index) => {
      const name = `type${index}`
      parameters.push({ name, type: sql.Char(2), value })
      return `@${name}`
    })

    // El JOIN es seguro: FavoriteScopeId es NOT NULL con FK a FavoriteScope.
    // El filtro de alcance toma global + el contexto actual (servidor y base vigentes).
    const stmt = `
        ;WITH FavoritosCTE AS (
          SELECT 
            f.idFavorito,
            f.cSchema,
            f.cNombreObjeto,
            f.cType,
            f.dFecha,
            f.lVigente,
            f.FavoriteScopeId,
            s.ServerName,
            s.DatabaseName
          FROM dbo.Favorito f
          INNER JOIN dbo.FavoriteScope s ON s.FavoriteScopeId = f.FavoriteScopeId
          WHERE f.idUsuario = @idUser
            AND f.cType     IN (${typePlaceholders.join(', ')})
            AND f.lVigente  = 1
            AND (
              (s.ServerName IS NULL AND s.DatabaseName IS NULL)
              OR (s.ServerName = @serverName AND (s.DatabaseName IS NULL OR s.DatabaseName = @databaseName))
            )
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
          A.FavoriteScopeId,
          A.ServerName,
          A.DatabaseName,
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
          f.idFavorito,
          f.cSchema,
          f.cNombreObjeto,
          f.cType,
          f.dFecha,
          f.lVigente,
          f.FavoriteScopeId,
          f.idUsuario,
          s.ServerName,
          s.DatabaseName
        FROM dbo.Favorito f
        INNER JOIN dbo.FavoriteScope s ON s.FavoriteScopeId = f.FavoriteScopeId
        WHERE f.idFavorito = @id
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
