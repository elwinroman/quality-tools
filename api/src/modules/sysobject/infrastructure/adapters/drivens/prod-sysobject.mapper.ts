import { format } from '@formkit/tempo'
import { PermissionRol } from '@sysobject/domain/schemas/permission-rol'
import { SysObject } from '@sysobject/domain/schemas/sysobject'
import { z } from 'zod'

// ── getByNameAndSchema ──────────────────────────────────────────────────────

export const ProdSysObjectRowSchema = z.object({
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

export type ProdSysObjectRow = z.infer<typeof ProdSysObjectRowSchema>

export function prodSysObjectRowMapper(row: ProdSysObjectRow): SysObject {
  return {
    id: row.object_id,
    name: row.name,
    type: row.type,
    typeDesc: row.type_desc,
    schemaId: row.schema_id,
    schemaName: row.schema_name,
    createDate: format(row.create_date, 'DD-MM-YYYY'),
    modifyDate: format(row.modify_date, 'DD-MM-YYYY'),
    definition: row.definition,
  }
}

// ── getRolesById ────────────────────────────────────────────────────────────

export const ProdPermissionRolRowSchema = z.object({
  state_desc: z.string(),
  permission_name: z.string(),
  rol: z.string(),
})

export type ProdPermissionRolRow = z.infer<typeof ProdPermissionRolRowSchema>

export function prodPermissionRolRowMapper(row: ProdPermissionRolRow): PermissionRol {
  return {
    stateDesc: row.state_desc,
    permissionName: row.permission_name,
    name: row.rol,
  }
}
