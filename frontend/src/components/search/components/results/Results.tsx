import { useEffect } from 'react'

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

  const isSearching = querySearch.length > 2
  const noResults = isSearching && suggestions.length === 0

  return (
    <div className="overflow-x-hidden overflow-y-auto">
      {(loadingSuggestions || loadingRecents) && <CircleLoader visible={true} color="white" />}

      {!loadingSuggestions && noResults && <p className="text-secondary mt-5 text-center">Sin resultados</p>}

      {!loadingRecents && !isSearching && recents.length > 0 && (
        <Recents recents={recents} updateOpen={updateOpen} onDelete={deleteRecent} />
      )}

      {!loadingSuggestions && isSearching && suggestions.length > 0 && (
        <CardWrapper title="Sugerencias">
          {suggestions.map((data, index) => (
            <Item key={data.id} objectId={data.id} updateOpen={updateOpen} active={index === activeIndex} index={index}>
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
