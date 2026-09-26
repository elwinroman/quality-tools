import { cn } from '@/lib/utils'

interface Props {
  schemaName: string
  name: string
  className?: string
}

/**
 * Nombre del objeto en el header del editor: el schema como contexto apagado y el
 * nombre como lo prominente.
 *
 * No renderiza nada si falta el nombre, así cada header decide su propio estado vacío.
 */
export function ObjectName({ schemaName, name, className }: Props) {
  if (!name) return null

  return (
    <span className={cn('flex min-w-0 items-center gap-1 text-sm', className)}>
      <span className="text-secondary shrink-0">{schemaName}</span>
      <span className="text-primary/80 min-w-0 truncate">{name}</span>
    </span>
  )
}
