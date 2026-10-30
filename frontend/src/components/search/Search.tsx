import { Code2, Search as SearchIcon, Table2 } from 'lucide-react'

import { Badge, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui'

import { Results } from './components/results/Results'
import { dialogSearchContext } from './context/dialogSearchContext'
import { searchContext } from './context/searchContext'

export function Search() {
  const { suggestions, activeIndex, updateQuerySearch, debounceGetSuggestions, updateSuggestions, updateActiveIndex, onSelect, type } =
    searchContext()
  const { open, updateOpen } = dialogSearchContext()

  // El badge identifica el alcance del buscador según la página que lo abrió
  const isUsertable = type === 'U'
  const BadgeIcon = isUsertable ? Table2 : Code2
  const badgeLabel = isUsertable ? 'Usertable' : 'SQL Definition'

  const handleSearchByTiping = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value

    if (newSearch.length > 2) debounceGetSuggestions(newSearch)
    else updateSuggestions([])

    updateActiveIndex(newSearch.length > 2 ? 0 : null)
    updateQuerySearch(newSearch)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestions.length) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      updateActiveIndex((current) => {
        if (current === null) return 0
        if (e.key === 'ArrowDown') return (current + 1) % suggestions.length
        return (current - 1 + suggestions.length) % suggestions.length
      })
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const selectedSuggestion = suggestions[activeIndex ?? 0]
      if (!selectedSuggestion) return

      onSelect(selectedSuggestion.schema, selectedSuggestion.name)
      updateOpen(false)
      updateQuerySearch('')
      updateSuggestions([])
      updateActiveIndex(null)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    updateOpen(isOpen)
    if (!isOpen) {
      updateQuerySearch('')
      updateSuggestions([])
      updateActiveIndex(null)
    }
  }

  return (
    <>
      <Dialog modal={false} open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="bg-background-card shadow-custom-dialog flex h-[60%] flex-col gap-1 overflow-hidden p-0 sm:max-w-2xl"
          showCloseButton={false}
        >
          <DialogHeader className="py-1">
            <DialogTitle>
              <div className="flex items-center gap-2 px-3">
                <SearchIcon size={16} className="text-secondary shrink-0" />
                <input
                  className="text-primary placeholder:text-muted flex h-8 min-w-0 flex-1 rounded-sm bg-transparent text-base font-normal file:bg-transparent placeholder:text-sm placeholder:font-normal focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-5"
                  placeholder="Escribe el nombre del objeto"
                  spellCheck={false}
                  onChange={handleSearchByTiping}
                  onKeyDown={handleKeyDown}
                />
                <Badge variant="outline" className="text-muted shrink-0 gap-1 border-dashed font-medium">
                  <BadgeIcon size={11} />
                  {badgeLabel}
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription className="hidden" />
          </DialogHeader>

          {/* Separador */}
          <div className="bg-border -mx-1 h-px"></div>

          {/* Body card */}
          <Results />

          {/* <footer className="h-10">Footer</footer> */}
        </DialogContent>
      </Dialog>
    </>
  )
}
