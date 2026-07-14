import { useNavigate } from 'react-router-dom'

import { FavoritosList, useFavoritoContext } from '@/components/favoritos'
import { SearchTrigger } from '@/components/search/components/SearchTrigger'
import { SearchProvider } from '@/components/search/context/searchContext'
import { Search } from '@/components/search/Search'
import { AppRoutes } from '@/constants'
import { buildQualifiedSysObjectPath } from '@/utilities/sysobject-route.util'

import { useSysObjectStore } from '../store/sysobject.store'
import { ViewModeSelect } from './panel-editor/ViewModeSelect'

export function PanelEditor() {
  const navigate = useNavigate()
  const { favoritos, deleteFavorito } = useFavoritoContext()
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const fetchSysObjectByName = useSysObjectStore((state) => state.fetchSysObjectByName)
  const navigateToSysObject = (schema: string, name: string) => {
    if (sysobject?.schemaName === schema && sysobject.name === name) {
      fetchSysObjectByName(schema, name)
      return
    }

    navigate(buildQualifiedSysObjectPath(AppRoutes.SQL_DEFINITION, schema, name))
  }

  return (
    <div className="border-border bg-background flex h-full flex-col border-r">
      {/* Controles superiores */}
      <div className="flex shrink-0 flex-col gap-7 px-4 py-6">
        <SearchProvider type="ALL_EXCEPT_USERTABLE" onSelect={navigateToSysObject}>
          <SearchTrigger />
          <Search />
        </SearchProvider>

        <ViewModeSelect />
      </div>

      {/* Favoritos */}
      <FavoritosList
        favoritos={favoritos}
        onDelete={deleteFavorito}
        onSelect={navigateToSysObject}
        activeObjectName={sysobject?.name}
        activeSchema={sysobject?.schemaName}
      />
    </div>
  )
}
