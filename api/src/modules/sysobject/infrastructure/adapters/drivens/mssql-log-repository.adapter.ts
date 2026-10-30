import { DatabaseName, getStaticDatabaseCredentials } from '@core/store'
import { MSSQLExecutor } from '@core/store/mssql-query-runner'
import { ForLogRepositoryPort, SearchLog } from '@sysobject/domain/ports/drivens/for-log-repository.port'
import sql from 'mssql'

export class MssqlLogRepositoryAdapter implements ForLogRepositoryPort {
  private db = getStaticDatabaseCredentials(DatabaseName.APP)

  constructor(private readonly executor: MSSQLExecutor) {}

  async createSearchLog(logSearch: SearchLog): Promise<boolean> {
    const stmt = `
        INSERT INTO dbo.LogBusqueda (idUsuario, idTipoAccion, cDatabase, cSchema, cBusqueda, cType, lProduccion, dFechaBusqueda)
        VALUES (@idUser, @actionType, @database, @schema, @search, @type, @isProduction, @createdAt)
      `
    const res = await this.executor.query({
      credentials: this.db.credentials,
      userType: this.db.type,
      statement: stmt,
      parameters: [
        { name: 'idUser', type: sql.Int, value: logSearch.idUser },
        { name: 'actionType', type: sql.Int, value: logSearch.actionType },
        { name: 'database', type: sql.VarChar(64), value: logSearch.database },
        { name: 'schema', type: sql.VarChar(64), value: logSearch.schema },
        { name: 'search', type: sql.VarChar(128), value: logSearch.search },
        { name: 'type', type: sql.Char(2), value: logSearch.type },
        { name: 'isProduction', type: sql.Bit, value: logSearch.isProduction },
        { name: 'createdAt', type: sql.DateTime, value: logSearch.createdAt },
      ],
    })

    if (res.rowsAffected[0] === 1) return true // se ha insertado correctamente (1 fila afectada)
    return false
  }
}
