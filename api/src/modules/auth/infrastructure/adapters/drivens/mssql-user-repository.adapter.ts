import { ForUserRepositoryPort } from '@auth/domain/ports/drivens'
import { PersistedUser, PrimitiveUser } from '@auth/domain/schemas/user'
import { DatabaseName } from '@core/store'
import { getStaticDatabaseCredentials } from '@core/store/get-static-store-credentials'
import { MSSQLConnection } from '@core/store/mssql-connection'
import { wrapDatabaseError } from '@core/utils'
import { decodeRow } from '@core/utils/decode-recordset.util'
import { logger } from '@observability/infrastructure/logging/logger-instance'
import sql from 'mssql'

import { userRowMapper, UserRowSchema } from './user.mapper'

export class MssqlUserRepositoryAdapter implements ForUserRepositoryPort {
  private db = getStaticDatabaseCredentials(DatabaseName.APP)

  constructor(private readonly connection: MSSQLConnection) {}

  async getOrCreate(user: PrimitiveUser, _userDatabase: string): Promise<PersistedUser | null> {
    let conn: sql.ConnectionPool | null = null
    let transaction: sql.Transaction | null = null

    try {
      conn = await this.connection.connect(this.db.credentials, this.db.type)
      transaction = new sql.Transaction(conn)

      await transaction.begin()
      const request = new sql.Request(transaction)

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

      request.input('hashId', sql.Char(32), user.hashId.getValue)
      request.input('user', sql.VarChar(64), user.user)
      request.input('host', sql.VarChar(64), user.host)
      request.input('aliasHost', sql.VarChar(64), user.aliasHost)
      request.input('createdAt', sql.DateTime2, user.createdAt)
      request.input('isActive', sql.Bit, user.isActive)

      const res = await request.query(stmt)

      const row = decodeRow(res.recordset, UserRowSchema)

      if (!row) {
        await transaction.rollback()
        return null
      }

      // se materializa antes del commit: una fila inválida hace rollback de la transacción
      const userRepository = userRowMapper(row)

      await transaction.commit()

      return userRepository
    } catch (err: unknown) {
      if (transaction) {
        try {
          await transaction.rollback()
        } catch (rollbackError) {
          logger.error('[auth] Error al hacer rollback:', { rollbackError })
        }
      }

      throw wrapDatabaseError(err)
    }
  }

  async getById(id: number): Promise<PersistedUser | null> {
    try {
      const conn = await this.connection.connect(this.db.credentials, this.db.type)
      const request = conn.request()

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
      request.input('id', sql.Int, id)
      const res = await request.query(stmt)

      const row = decodeRow(res.recordset, UserRowSchema)

      if (!row) return null

      return userRowMapper(row)
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
