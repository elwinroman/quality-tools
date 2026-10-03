import { cn } from '@/lib/utils'
import type { Permission } from '@/models/object.model'

/** Forma base del chip: compacto, sin borde y con la tipografia de la casa. */
const chipBase = 'inline-flex max-w-full items-center rounded px-1.5 py-0.5 text-[11px] leading-none'

/**
 * Familias de color de la casa, solo con tokens de la paleta (sin hex crudo).
 * Unica fuente de la paleta de permisos para que sea facil de ajustar.
 */
const CHIP_FAMILIES = {
  primary: 'bg-palette-primary-main/10 text-palette-primary-dark dark:text-palette-primary-light',
  info: 'bg-palette-info-main/10 text-palette-info-dark dark:text-palette-info-light',
  secondary: 'bg-palette-secondary-main/10 text-palette-secondary-dark dark:text-palette-secondary-light',
  success: 'bg-palette-success-main/10 text-palette-success-dark dark:text-palette-success-light',
  denied: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  neutral: 'bg-background-neutral text-secondary',
} as const

/** Verbos de lectura (y sus variantes de vista). */
const READ_VERBS = new Set(['SELECT', 'VIEW', 'REFERENCES'])

/** Verbos de escritura. */
const WRITE_VERBS = new Set(['INSERT', 'UPDATE', 'DELETE', 'MERGE'])

/** Estados que niegan el permiso. */
const DENIED_STATES = new Set(['DENY', 'REVOKE'])

/** Chip del verbo: ejecucion en primary, lectura en info, escritura en secondary, el resto neutro. */
export function verbChipClass(permissionName: string) {
  const verb = permissionName.toUpperCase()

  if (verb.includes('EXECUTE') || verb.includes('CALL')) return cn(chipBase, CHIP_FAMILIES.primary)
  if (READ_VERBS.has(verb) || verb.startsWith('VIEW')) return cn(chipBase, CHIP_FAMILIES.info)
  if (WRITE_VERBS.has(verb)) return cn(chipBase, CHIP_FAMILIES.secondary)

  return cn(chipBase, CHIP_FAMILIES.neutral)
}

/** Chip del estado: GRANT en success, DENY / REVOKE en rose, el resto neutro. */
export function stateChipClass(stateDesc: string) {
  const state = stateDesc.toUpperCase()

  if (state === 'GRANT') return cn(chipBase, CHIP_FAMILIES.success)
  if (DENIED_STATES.has(state)) return cn(chipBase, CHIP_FAMILIES.denied)

  return cn(chipBase, CHIP_FAMILIES.neutral)
}

interface PermissionRowProps {
  permission: Permission
}

/**
 * Fila de permiso: el rol va en su propia linea (sin truncar) y los chips debajo.
 * Apilarlos evita que un nombre de rol largo pelee por el ancho con los chips.
 */
export function PermissionRow({ permission }: PermissionRowProps) {
  return (
    <li className="flex min-w-0 flex-col gap-1">
      <span className="text-primary text-xs">{permission.name}</span>

      <span className="flex flex-wrap items-center gap-1">
        <span className={verbChipClass(permission.permissionName)}>{permission.permissionName}</span>
        <span className={stateChipClass(permission.stateDesc)}>{permission.stateDesc}</span>
      </span>
    </li>
  )
}

interface PermissionChipsProps {
  permissions: Permission[]
}

/** Lista de permisos en grilla: se usa como valor de una fila de la metadata. */
export function PermissionChips({ permissions }: PermissionChipsProps) {
  if (permissions.length === 0) return <p className="text-muted text-xs">Sin permisos.</p>

  return (
    <ul className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
      {permissions.map((permission) => (
        <PermissionRow key={`${permission.name}-${permission.permissionName}-${permission.stateDesc}`} permission={permission} />
      ))}
    </ul>
  )
}
