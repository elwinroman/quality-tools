import { cn } from '@/lib/utils'

export interface OverviewDefinitionItem {
  label: string
  value: React.ReactNode
  /** Ocupa las dos columnas de la grilla (fila de ancho completo). */
  spanFull?: boolean
}

interface OverviewDefinitionRowProps {
  label: string
  value: React.ReactNode
  /** Ocupa las dos columnas de la grilla (fila de ancho completo). */
  spanFull?: boolean
}

/** Fila de una lista de definicion: etiqueta atenuada y valor en texto normal. */
export function OverviewDefinitionRow({ label, value, spanFull }: OverviewDefinitionRowProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-0.5', spanFull && 'sm:col-span-2')}>
      <dt className="text-secondary text-xs">{label}</dt>
      <dd className="text-primary min-w-0 text-sm font-medium break-words">{value}</dd>
    </div>
  )
}

interface OverviewDefinitionListProps {
  items: OverviewDefinitionItem[]
  className?: string
}

/** Lista de definicion con columnas del ancho de su contenido: los pares quedan juntos a la izquierda. */
export function OverviewDefinitionList({ items, className }: OverviewDefinitionListProps) {
  return (
    <dl className={cn('grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-[auto_auto] sm:justify-start', className)}>
      {items.map((item) => (
        <OverviewDefinitionRow key={item.label} label={item.label} value={item.value} spanFull={item.spanFull} />
      ))}
    </dl>
  )
}
