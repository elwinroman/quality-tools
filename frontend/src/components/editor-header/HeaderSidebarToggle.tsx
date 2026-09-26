import { PanelLeft } from 'lucide-react'

import { cn } from '@/lib/utils'

interface Props {
  onClick(): void
  className?: string
}

/**
 * Botón para volver a mostrar el sidebar cuando está colapsado.
 *
 * El toggle que lo colapsa vive en `SidebarHeader`; acá sólo se lo revela, porque
 * una vez colapsado el sidebar deja de verse a sí mismo.
 */
export function HeaderSidebarToggle({ onClick, className }: Props) {
  return (
    <button
      type="button"
      className={cn('hover:bg-background-neutral shrink-0 cursor-pointer rounded-sm px-1 py-1', className)}
      onClick={onClick}
      aria-label="Mostrar panel lateral"
    >
      <PanelLeft size={16} />
    </button>
  )
}
