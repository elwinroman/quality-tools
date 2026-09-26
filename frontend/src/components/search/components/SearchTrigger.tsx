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
    <Button variant="myGhost" size="sm" className={cn('flex h-7 w-auto items-center gap-2 px-2', className)} onClick={handleClick}>
      <SearchIcon size={16} className="text-muted shrink-0" />
      <span className="text-xs whitespace-nowrap">Buscar</span>
    </Button>
  )
}
