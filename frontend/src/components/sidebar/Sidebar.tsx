import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

interface Props {
  /** Fila superior fija. */
  header: ReactNode
  /** Cuerpo de la columna: crece y scrollea. */
  children: ReactNode
  /** Fila inferior fija, opcional. */
  footer?: ReactNode
  className?: string
}

/**
 * Base del sidebar: columna de altura completa con fila superior fija, cuerpo que crece
 * y fila inferior fija. El contenido lo aporta cada consumidor, no la base.
 */
export function Sidebar({ header, children, footer, className }: Props) {
  return (
    <div className={cn('border-border bg-background flex h-full flex-col border-r', className)}>
      {header}

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>

      {footer}
    </div>
  )
}
