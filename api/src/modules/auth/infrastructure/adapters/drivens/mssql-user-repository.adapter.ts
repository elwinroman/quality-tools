import { ForUserRepositoryPort } from '@auth/domain/ports/drivens'
import { PrimitiveUser, RepoUser, User } from '@auth/domain/schemas/user'
import { DatabaseName, MSSQLDatabaseConnection } from '@core/store'
import { getStaticDatabaseCredentials } from '@core/store/get-store-credentials'
import { wrapDatabaseError } from '@core/utils'
import { logger } from '@observability/infrastructure/logging/logger-instance'
import sql from 'mssql'

export class MssqlUserRepositoryAdapter implements ForUserRepositoryPort {
  private connection = new MSSQLDatabaseConnection()
  private db = getStaticDatabaseCredentials(DatabaseName.APP)

  async getOrCreate(user: PrimitiveUser, _userDatabase: string): Promise<RepoUser | null> {
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

      if (res.recordset && res.recordset.length === 1) {
        const userData = res.recordset[0]

        const userRepository = User.create({
          id: userData.idUsuario,
          hashId: userData.cHashUsuarioUID,
          user: userData.cUsuario,
          host: userData.cServer,
          aliasHost: userData.cAliasServer,
          createdAt: userData.dFechaRegistro,
          isActive: userData.lVigente,
        }).toRepoUser()

        await transaction.commit()

        return userRepository
      }

      await transaction.rollback()
      return null
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

  async getById(id: number): Promise<RepoUser | null> {
    try {
      const conn = await this.connection.connect(this.db.credentials, this.db.type)
      const request = conn.request()

      const stmt = 'SELECT * FROM dbo.Usuario WHERE idUsuario = @id'
      request.input('id', sql.Int, id)
      const res = await request.query(stmt)

      if (res.recordset && res.recordset.length === 1) {
        const userData = res.recordset[0]

        return User.create({
          id: userData.idUsuario,
          hashId: userData.cHashUsuarioUID,
          user: userData.cUsuario,
          host: userData.cServer,
          aliasHost: userData.cAliasServer,
          createdAt: userData.dFechaRegistro,
          isActive: userData.lVigente,
        }).toRepoUser()
      }

      return null
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
