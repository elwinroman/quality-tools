import { createContext, ReactNode, useContext, useState, type Dispatch, type SetStateAction } from 'react'

import { useSearchSuggestions } from '@/components/search/hooks'
import { ApiSysObjectType, SysObjectSuggestion } from '@/models/sysobject'

interface ContextProps {
  /** Componentes React */
  children: ReactNode

  /** Tipo de búsqueda (para SQLDefinition y Usertable) */
  type: ApiSysObjectType

  /** Callback al seleccionar un objeto (search result, recent, etc.) */
  onSelect(objectId: number): void
}

export interface SearchContextType {
  // Sugerencias
  querySearch: string
  suggestions: SysObjectSuggestion[]
  activeIndex: number | null
  updateQuerySearch(inputText: string): void
  updateSuggestions(suggestionsList: SysObjectSuggestion[]): void
  updateActiveIndex(index: number | null | ((current: number | null) => number | null)): void
  debounceGetSuggestions(search: string): void
  loading: boolean
  error: {
    title: string
    detail: string
  } | null

  /** Tipo de búsqueda */
  type: ApiSysObjectType

  /** Callback al seleccionar un objeto */
  onSelect(objectId: number): void
}

// crea contexto
export const SearchContext = createContext<SearchContextType | null>(null)

// provider
export const SearchProvider = ({ children, type, onSelect }: ContextProps) => {
  const { querySearch, suggestions, updateQuerySearch, updateSuggestions, debounceGetSuggestions, loading, error } =
    useSearchSuggestions(type)
  const [activeIndex, setActiveIndex] = useState<number | null>(0)

  const updateActiveIndex: Dispatch<SetStateAction<number | null>> = setActiveIndex

  return (
    <SearchContext.Provider
      value={{
        querySearch,
        suggestions,
        activeIndex,
        updateQuerySearch,
        updateSuggestions,
        updateActiveIndex,
        debounceGetSuggestions,
        loading,
        error,
        type,
        onSelect,
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export const searchContext = () => {
  const context = useContext(SearchContext)
  if (!context) throw new Error(`${searchContext.name} debe usarse dentro de <SearchContext>`)

  return context
}
