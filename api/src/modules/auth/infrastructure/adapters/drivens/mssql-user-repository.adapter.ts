import { ForUserRepositoryPort } from '@auth/domain/ports/drivens'
import { PersistedUser, PrimitiveUser } from '@auth/domain/schemas/user'
import { DatabaseName } from '@core/store'
import { getStaticDatabaseCredentials } from '@core/store/get-static-store-credentials'
import { MSSQLExecutor, MSSQLTransactionRunner } from '@core/store/mssql-query-runner'
import { decodeRow } from '@core/utils/decode-recordset.util'
import sql from 'mssql'

import { userRowMapper, UserRowSchema } from './user.mapper'

export class MssqlUserRepositoryAdapter implements ForUserRepositoryPort {
  private db = getStaticDatabaseCredentials(DatabaseName.APP)

  constructor(
    private readonly executor: MSSQLExecutor,
    private readonly transactionRunner: MSSQLTransactionRunner,
  ) {}

  async getOrCreate(user: PrimitiveUser, _userDatabase: string): Promise<PersistedUser | null> {
    return this.transactionRunner.runInTransaction(this.db.credentials, this.db.type, async ({ query, rollback }) => {
      const stmt = `
        MERGE INTO dbo.Usuario AS target
        USING (
            SELECT 
                @hashId AS hashId, @user AS usuario, @host AS server, 
                @aliasHost AS aliasServer, @createdAt AS fechaRegistro, 
                @isActive AS vigente
            ) AS source
        ON target.cHashUsuarioUID = source.hashId
        WHEN MATCHED THEN
            --============================================================
            -- Si el registro existe, devuelve el registro existente
            --============================================================
            UPDATE SET 
                target.cHashUsuarioUID = target.cHashUsuarioUID  -- No hay cambios reales
        WHEN NOT MATCHED THEN
            --============================================================
            -- Si no existe, realiza la inserción
            --============================================================
            INSERT (cHashUsuarioUID, cUsuario, cServer, cAliasServer, dFechaRegistro, lVigente)
            VALUES (source.hashId, source.usuario, source.server, source.aliasServer, source.fechaRegistro, source.vigente)
        OUTPUT INSERTED.idUsuario, INSERTED.cHashUsuarioUID, INSERTED.cUsuario, 
            INSERTED.cServer, INSERTED.cAliasServer, INSERTED.dFechaRegistro, INSERTED.lVigente;
      `

      const res = await query({
        statement: stmt,
        parameters: [
          { name: 'hashId', type: sql.Char(32), value: user.hashId.getValue },
          { name: 'user', type: sql.VarChar(64), value: user.user },
          { name: 'host', type: sql.VarChar(64), value: user.host },
          { name: 'aliasHost', type: sql.VarChar(64), value: user.aliasHost },
          { name: 'createdAt', type: sql.DateTime2, value: user.createdAt },
          { name: 'isActive', type: sql.Bit, value: user.isActive },
        ],
      })

      const row = decodeRow(res.recordset, UserRowSchema)

      if (!row) {
        await rollback()
        return null
      }

      // se materializa antes del commit: una fila inválida hace rollback de la transacción
      const userRepository = userRowMapper(row)

      return userRepository
    })
  }

  async getById(id: number): Promise<PersistedUser | null> {
    const stmt = `
        SELECT
          idUsuario,
          cHashUsuarioUID,
          cUsuario,
          cServer,
          cAliasServer,
          dFechaRegistro,
          lVigente
        FROM dbo.Usuario
        WHERE idUsuario = @id
      `
    const res = await this.executor.query({
      credentials: this.db.credentials,
      userType: this.db.type,
      statement: stmt,
      parameters: [{ name: 'id', type: sql.Int, value: id }],
    })

    const row = decodeRow(res.recordset, UserRowSchema)

    if (!row) return null

    return userRowMapper(row)
  }
}
