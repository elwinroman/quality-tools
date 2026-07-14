import { FILE_DATABASE_NAME_PREFIX } from '@/enviroment/enviroment'

export const isFileDatabaseName = (databaseName: string) => databaseName.startsWith(FILE_DATABASE_NAME_PREFIX)

export const filterFileDatabases = (databases: string[], showFileDatabases: boolean) => {
  if (showFileDatabases) return databases

  return databases.filter((database) => !isFileDatabaseName(database))
}
