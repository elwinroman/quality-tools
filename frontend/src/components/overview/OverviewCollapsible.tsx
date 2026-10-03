import { ChevronRight } from 'lucide-react'
import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'

interface OverviewCollapsibleProps {
  title: string
  /** Conteo mostrado en el badge de la derecha. Sin conteo no renderiza badge. */
  count?: number
  defaultOpen?: boolean
  /** Callback invocado una sola vez la primera vez que se expande. */
  onExpand?: () => void
  className?: string
  children: React.ReactNode
}

/** Fila colapsable de ancho completo con chevron, titulo y badge de conteo opcional. */
export function OverviewCollapsible({ title, count, defaultOpen = false, onExpand, className, children }: OverviewCollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const hasExpanded = useRef(defaultOpen)

  /** Alterna el estado y dispara `onExpand` una sola vez al abrir. */
  const toggle = () => {
    const next = !isOpen
    setIsOpen(next)

    if (next && !hasExpanded.current) {
      hasExpanded.current = true
      onExpand?.()
    }
  }

  return (
    <div className={cn('border-border rounded-sm border', className)}>
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronRight size={14} className={cn('text-secondary shrink-0 transition-transform', isOpen && 'rotate-90')} />
          <span className="text-primary truncate text-sm font-medium">{title}</span>
        </span>
        {count !== undefined && (
          <span className="border-border text-muted shrink-0 rounded-sm border px-1.5 py-0.5 text-[11px] leading-none">{count}</span>
        )}
      </button>

      {isOpen && <div className="border-border border-t p-3">{children}</div>}
    </div>
  )
}
