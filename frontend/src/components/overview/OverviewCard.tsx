import { cn } from '@/lib/utils'

interface OverviewCardProps {
  /** Titulo del encabezado. Sin titulo la tarjeta no renderiza encabezado. */
  title?: React.ReactNode
  /** Valor secundario alineado a la derecha del encabezado. */
  meta?: React.ReactNode
  /** Elemento opcional (por ejemplo un chevron) junto al meta. */
  indicator?: React.ReactNode
  /** Clases adicionales para el cuerpo de la tarjeta. */
  bodyClassName?: string
  className?: string
  children: React.ReactNode
}

/** Cuadro del Overview: solo borde y encabezado opcional, sin superficie propia. */
export function OverviewCard({ title, meta, indicator, bodyClassName, className, children }: OverviewCardProps) {
  return (
    <div className={cn('border-border rounded-sm border', className)}>
      {title !== undefined && (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-primary text-sm font-medium">{title}</span>
          <span className="flex items-center gap-2">
            {meta !== undefined && <span className="text-secondary text-xs">{meta}</span>}
            {indicator}
          </span>
        </div>
      )}

      {/* Sin padding superior para que el titulo fluya en el contenido. */}
      <div className={cn('px-3 pb-3', title === undefined && 'pt-3', bodyClassName)}>{children}</div>
    </div>
  )
}
