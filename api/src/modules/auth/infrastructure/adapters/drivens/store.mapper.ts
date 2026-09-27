import { PermissionStore, StoreInfo } from '@auth/domain/schemas/store'
import { z } from 'zod'

// ── getDetails ──────────────────────────────────────────────────────────────

export const StoreDetailsRowSchema = z.object({
  name: z.string(),
  // cmptlevel es tinyint en la base, así que vuelve numérico.
  cmptlevel: z.number().int(),
  // subconsulta sobre sys.extended_properties: NULL cuando no hay descripción.
  value: z.string().nullable(),
  server_name: z.string(),
})

export type StoreDetailsRow = z.infer<typeof StoreDetailsRowSchema>

/**
 * La base de pre-producción entra por parámetro porque el mapper no puede leer
 * `@/config/enviroment`: importarlo dispara la validación de entorno.
 */
export function storeDetailsRowMapper(row: StoreDetailsRow, prodDatabase: string): StoreInfo {
  return {
    name: row.name,
    compatibility: row.cmptlevel,
    description: row.value,
    server: row.server_name,
    prodDatabase,
  }
}

// ── getPermission ───────────────────────────────────────────────────────────

export const StorePermissionRowSchema = z.object({
  viewdefinition_permission: z.boolean(),
})

export type StorePermissionRow = z.infer<typeof StorePermissionRowSchema>

export function storePermissionRowMapper(row: StorePermissionRow): PermissionStore {
  return {
    viewdefinitionPermission: Boolean(row.viewdefinition_permission),
  }
}

// ── getDatabases ────────────────────────────────────────────────────────────

export const DatabaseNameRowSchema = z.object({
  name: z.string(),
})

export type DatabaseNameRow = z.infer<typeof DatabaseNameRowSchema>

export function databaseNameRowMapper(row: DatabaseNameRow): string {
  return row.name
}
