import { useEffect, useLayoutEffect, useRef } from 'react'

import { CircleLoader } from '@/components/loader'

import { dialogSearchContext } from '../../context/dialogSearchContext'
import { searchContext } from '../../context/searchContext'
import { useRecents } from '../../hooks/useRecents'
import { CardWrapper } from './components/CardWrapper'
import { Item } from './components/Item'
import { Recents } from './components/Recents'

export function Results() {
  const { suggestions, querySearch, loading: loadingSuggestions, type, activeIndex, updateActiveIndex } = searchContext()
  const { open, updateOpen } = dialogSearchContext()
  const { recents, getRecents, deleteRecent, loading: loadingRecents } = useRecents(type)
  const resultsRef = useRef<HTMLDivElement | null>(null)
  const activeItemRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    if (!open) return
    getRecents()
  }, [open])

  useEffect(() => {
    if (!suggestions.length) {
      updateActiveIndex(null)
      return
    }

    if (activeIndex === null || activeIndex >= suggestions.length) updateActiveIndex(0)
  }, [suggestions, activeIndex, updateActiveIndex])

  useLayoutEffect(() => {
    const results = resultsRef.current
    const activeItem = activeItemRef.current

    if (!results || !activeItem) return

    const resultsRect = results.getBoundingClientRect()
    const itemRect = activeItem.getBoundingClientRect()

    if (itemRect.top < resultsRect.top) {
      results.scrollTop += itemRect.top - resultsRect.top
      return
    }

    if (itemRect.bottom > resultsRect.bottom) {
      results.scrollTop += itemRect.bottom - resultsRect.bottom
    }
  }, [activeIndex, suggestions.length])

  const isSearching = querySearch.length > 2
  const noResults = isSearching && suggestions.length === 0

  return (
    <div ref={resultsRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      {(loadingSuggestions || loadingRecents) && <CircleLoader visible={true} color="white" />}

      {!loadingSuggestions && noResults && <p className="text-secondary mt-5 text-center">Sin resultados</p>}

      {!loadingRecents && !isSearching && recents.length > 0 && (
        <Recents recents={recents} updateOpen={updateOpen} onDelete={deleteRecent} />
      )}

      {!loadingSuggestions && isSearching && suggestions.length > 0 && (
        <CardWrapper title="Sugerencias">
          {suggestions.map((data, index) => (
            <Item
              key={data.id}
              ref={index === activeIndex ? activeItemRef : undefined}
              objectId={data.id}
              updateOpen={updateOpen}
              active={index === activeIndex}
            >
              <div className="flex w-full items-center justify-between gap-1 transition-colors">
                <p className="flex flex-col">
                  <span className="text-secondary overflow-hidden text-[0.75rem]">{data.schema}</span>
                  <span className="text-primary group-hover:text-primary overflow-hidden">{data.name}</span>
                </p>
                <span className="bg-background-neutral text-secondary overflow-hidden rounded-sm px-1 py-0.5 text-[0.65rem] font-bold">
                  {data.typeDesc}
                </span>
              </div>
            </Item>
          ))}
        </CardWrapper>
      )}
    </div>
  )
}
