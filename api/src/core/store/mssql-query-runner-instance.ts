import { mssqlConnection } from './mssql-connection-instance'
import { MSSQLQueryRunner } from './mssql-query-runner'

export const mssqlQueryRunner = new MSSQLQueryRunner(mssqlConnection)
