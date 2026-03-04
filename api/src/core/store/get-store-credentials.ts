import { StoreUserSchema } from '@shared/domain/store'

import {
  DBNAME,
  DBPASSWORD,
  DBSERVER,
  DBUSERNAME,
  NODE_ENV,
  // FINLOG: en pruebas, descomentar cuando esté listo
  // FINLOG_DBNAME,
  // FINLOG_DBPASSWORD,
  // FINLOG_DBSERVER,
  // FINLOG_DBUSERNAME,
  PREPROD_DBNAME,
  PREPROD_DBPASSWORD,
  PREPROD_DBSERVER,
  PREPROD_DBUSERNAME,
} from '@/config/enviroment'

import { MODE } from '@/constants/commons'

import { ValkeyCacheRepository } from '../cache/valkey-cache-repository'
import { DatabaseName } from './database.enum'
import { UserType, UserTypeEnum } from './mssql-database-connection'

/** Credenciales estáticas (para uso sincrónico) */
const STATIC_CREDENTIALS: Record<DatabaseName, StoreUserSchema> = {
  [DatabaseName.PREPROD]: {
    host: PREPROD_DBSERVER,
    database: PREPROD_DBNAME,
    user: PREPROD_DBUSERNAME,
    password: PREPROD_DBPASSWORD,
  },
  [DatabaseName.APP]: {
    host: DBSERVER,
    database: DBNAME,
    user: DBUSERNAME,
    password: DBPASSWORD,
  },
  // FINLOG: en pruebas, descomentar cuando esté listo
  // [DatabaseName.LOG]: {
  //   host: FINLOG_DBSERVER,
  //   database: FINLOG_DBNAME,
  //   user: FINLOG_DBUSERNAME,
  //   password: FINLOG_DBPASSWORD,
  // },
}

/**
 * Retorna las credenciales internas de la base de datos según el nombre y el tipo (Interna)
 * @throws {Error} Si el nombre de base de datos no existe o credenciales no disponibles
 */
export function getStaticDatabaseCredentials(name: DatabaseName): { credentials: StoreUserSchema; type: UserType } {
  if (!(name in STATIC_CREDENTIALS)) throw new Error(`Nombre de base de datos no estática: ${name}`)

  return { credentials: STATIC_CREDENTIALS[name], type: UserTypeEnum.Internal }
}

export async function getCacheDatabaseCredentials(userId: number): Promise<{ credentials: StoreUserSchema; type: UserType } | null> {
  const key = `auth:credentials:${userId}`

  const cacheRepository = new ValkeyCacheRepository()
  const cachedCredentials = await cacheRepository.get(key)

  // si no existe la credencial en la caché
  if (!cachedCredentials) return null

  const credentials = JSON.parse(cachedCredentials)

  return {
    credentials,
    type: UserTypeEnum.External,
  }
}
