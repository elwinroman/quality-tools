import { forwardRef } from 'react'

import { searchContext } from '@/components/search/context/searchContext'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  objectId: number
  schema: string
  objectName: string
  updateOpen(state: boolean): void
  active?: boolean
}

export const Item = forwardRef<HTMLLIElement, Props>(function Item(
  { children, objectId, schema, objectName, updateOpen, active = false },
  ref,
) {
  const { onSelect, updateSuggestions, updateQuerySearch } = searchContext()

  const handleClickGetObject = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()

    onSelect(schema, objectName)

    // cierra el modal inmediatamente
    updateOpen(false)
    updateQuerySearch('')
    updateSuggestions([])
  }

  return (
    <li key={objectId} ref={ref}>
      <button
        aria-current={active}
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
})
