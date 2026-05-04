import { searchContext } from '@/components/search/context/searchContext'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  objectId: number
  updateOpen(state: boolean): void
  active?: boolean
  index?: number
}

export function Item({ children, objectId, updateOpen, active = false, index = 0 }: Props) {
  const { onSelect, updateSuggestions, updateQuerySearch, updateActiveIndex } = searchContext()

  const handleClickGetObject = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    const id = Number(e.currentTarget.dataset.objectId)

    // dispara el fetch via callback (cada página decide qué store usar)
    onSelect(id)

    // cierra el modal inmediatamente
    updateOpen(false)
    updateQuerySearch('')
    updateSuggestions([])
  }

  return (
    <li key={objectId}>
      <button
        data-object-id={objectId}
        aria-current={active}
        onMouseEnter={() => updateActiveIndex(index)}
        className={cn(
          'group text-secondary pointer-events-auto flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left align-text-top text-sm transition-colors',
          active ? 'bg-action-hover text-primary' : 'hover:bg-action-hover hover:text-primary',
        )}
        onClick={handleClickGetObject}
      >
        {children}
      </button>
    </li>
  )
}
