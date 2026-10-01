import { Search as SearchIcon } from 'lucide-react'
import { useEffect } from 'react'

import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

import { dialogSearchContext } from '../context/dialogSearchContext'

interface Props {
  className?: string
}

/**
 * Abre el modal de búsqueda de objetos. Además escucha la tecla `/` para abrirlo
 * desde cualquier lado; el atajo ya no se anuncia en el botón.
 */
export function SearchTrigger({ className }: Props) {
  const { open, updateOpen } = dialogSearchContext()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/') return

      const target = e.target as HTMLElement
      const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      if (isEditable) return

      e.preventDefault()
      updateOpen(true)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    updateOpen(!open)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('group flex h-7 min-w-[112px] items-center justify-between gap-2 px-2', className)}
      onClick={handleClick}
    >
      <span className="flex items-center gap-2">
        <SearchIcon size={16} className="text-secondary shrink-0" />
        <span className="text-secondary text-xs whitespace-nowrap">Buscar</span>
      </span>

      {/* El atajo se muestra al apuntar; sin hover disponible (táctil) queda siempre visible */}
      <kbd
        aria-hidden="true"
        className="rounded-sm bg-black px-1 py-0.5 font-sans text-[10px] leading-none font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        /
      </kbd>
    </Button>
  )
}
