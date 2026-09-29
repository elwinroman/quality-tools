import { DatabaseName, getStaticDatabaseCredentials } from '@core/store'
import { MSSQLConnection } from '@core/store/mssql-connection'
import { wrapDatabaseError } from '@core/utils'
import { ForLogRepositoryPort, SearchLog } from '@sysobject/domain/ports/drivens/for-log-repository.port'
import sql from 'mssql'

export class MssqlLogRepositoryAdapter implements ForLogRepositoryPort {
  private db = getStaticDatabaseCredentials(DatabaseName.APP)

  constructor(private readonly connection: MSSQLConnection) {}

  async createSearchLog(logSearch: SearchLog): Promise<boolean> {
    try {
      const conn = await this.connection.connect(this.db.credentials, this.db.type)
      const request = conn.request()

      const stmt = `
        INSERT INTO dbo.LogBusqueda (idUsuario, idTipoAccion, cDatabase, cSchema, cBusqueda, cType, lProduccion, dFechaBusqueda)
        VALUES (@idUser, @actionType, @database, @schema, @search, @type, @isProduction, @createdAt)
      `
      request.input('idUser', sql.Int, logSearch.idUser)
      request.input('actionType', sql.Int, logSearch.actionType)
      request.input('database', sql.VarChar(64), logSearch.database)
      request.input('schema', sql.VarChar(64), logSearch.schema)
      request.input('search', sql.VarChar(128), logSearch.search)
      request.input('type', sql.Char(2), logSearch.type)
      request.input('isProduction', sql.Bit, logSearch.isProduction)
      request.input('createdAt', sql.DateTime, logSearch.createdAt)

      const res = await request.query(stmt)

      if (res.rowsAffected[0] === 1) return true // se ha insertado correctamente (1 fila afectada)
      return false
    } catch (err) {
      throw wrapDatabaseError(err)
    }
  }
}
