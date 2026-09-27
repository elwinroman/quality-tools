import { convertLocalToUTC } from '@core/utils/convert-local-to-utc.util'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import { SysObject, SysObjectRelationSummary, SysObjectSummary } from '@sysobject/domain/schemas/sysobject'
import { z } from 'zod'

// ── getBySchemaAndName ──────────────────────────────────────────────────────

export const SysObjectRowSchema = z.object({
  object_id: z.number().int(),
  name: z.string(),
  // type es CHAR(2) en la base, así que vuelve con relleno ('V ').
  type: z.string().trim(),
  type_desc: z.string(),
  schema_id: z.number().int(),
  schema_name: z.string(),
  create_date: z.date(),
  modify_date: z.date(),
  definition: z.string(),
})

export type SysObjectRow = z.infer<typeof SysObjectRowSchema>

/**
 * La zona horaria entra por parámetro, no por import: este archivo lo carga un test,
 * y `@/config/enviroment` valida el entorno con `process.exit` al importarse.
 */
export function sysObjectRowMapper(row: SysObjectRow, timeZone: string): SysObject {
  return {
    id: row.object_id,
    name: row.name,
    type: row.type,
    typeDesc: row.type_desc,
    schemaId: row.schema_id,
    schemaName: row.schema_name,
    createDate: convertLocalToUTC(row.create_date, timeZone),
    modifyDate: convertLocalToUTC(row.modify_date, timeZone),
    definition: row.definition,
  }
}

// ── getRolesById ────────────────────────────────────────────────────────────

export const PermissionRolRowSchema = z.object({
  state_desc: z.string(),
  permission_name: z.string(),
  rol: z.string(),
})

export type PermissionRolRow = z.infer<typeof PermissionRolRowSchema>

export function permissionRolRowMapper(row: PermissionRolRow): PermissionRol {
  return {
    stateDesc: row.state_desc,
    permissionName: row.permission_name,
    name: row.rol,
  }
}

// ── findByNameAndType ───────────────────────────────────────────────────────

export const SysObjectSummaryRowSchema = z.object({
  object_id: z.number().int(),
  name: z.string(),
  schema_name: z.string(),
  type_desc: z.string(),
  // peso sólo ordena la consulta; no viaja al dominio.
  peso: z.number().int(),
})

export type SysObjectSummaryRow = z.infer<typeof SysObjectSummaryRowSchema>

export function sysObjectSummaryRowMapper(row: SysObjectSummaryRow): SysObjectSummary {
  return {
    id: row.object_id,
    name: row.name,
    schemaName: row.schema_name,
    typeDesc: row.type_desc.trim(),
  }
}

// ── dependientes y dependencias ─────────────────────────────────────────────

/**
 * Las dos consultas de relaciones —y sus dos fallbacks— proyectan exactamente las
 * mismas cuatro columnas, así que comparten schema y mapper.
 *
 * `object_name` se declara no nulo porque las consultas lo garantizan con
 * `COALESCE` o un join que no lo deja pasar; un null ahí sería un bug de la
 * consulta, no un dato.
 */
export const SysObjectRelationRowSchema = z.object({
  object_id: z.number().int().nullable(),
  schema_name: z.string().nullable(),
  object_name: z.string(),
  type_desc: z.string().nullable(),
})

export type SysObjectRelationRow = z.infer<typeof SysObjectRelationRowSchema>

export function sysObjectRelationRowMapper(row: SysObjectRelationRow): SysObjectRelationSummary {
  return {
    id: row.object_id,
    name: row.object_name,
    schemaName: row.schema_name,
    typeDesc: row.type_desc?.trim() ?? '',
  }
}
