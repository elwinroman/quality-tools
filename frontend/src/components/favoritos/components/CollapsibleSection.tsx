import { ChevronRight } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

interface Props {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({ title, children, defaultOpen = true }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <button
        type="button"
        className="group/section flex shrink-0 cursor-pointer items-center justify-between gap-1 rounded-sm px-2 py-2 text-left"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {/* Color y hover de texto con la misma regla que los ítems de menú */}
        <span className="text-primary/60 group-hover/section:text-primary text-sm font-semibold">{title}</span>
        <ChevronRight
          size={14}
          className={cn(
            'text-secondary shrink-0 opacity-0 transition-transform duration-200 group-hover/section:opacity-100',
            isOpen && 'rotate-90',
          )}
        />
      </button>

      <div
        className={cn(
          'grid min-h-0 flex-1 transition-[grid-template-rows] duration-200 ease-in-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className={cn('SX flex h-full flex-col gap-0.5', !isOpen && 'overflow-hidden')}>{children}</ul>
        </div>
      </div>
    </div>
  )
}
