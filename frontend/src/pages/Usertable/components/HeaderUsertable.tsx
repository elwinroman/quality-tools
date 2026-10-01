import { HeaderSidebarToggle, ObjectName, RefreshObjectButton } from '@/components/editor-header'
import { ToggleFavoritoButton, useFavoritoContext } from '@/components/favoritos'
import { SearchTrigger } from '@/components/search/components/SearchTrigger'

import { useUserTableStore } from '../store/usertable.store'
import { HeaderTabsUsertable } from './HeaderTabsUsertable'

interface Props {
  onOpenSidebar?: () => void
}

export function HeaderUsertable({ onOpenSidebar }: Props) {
  const object = useUserTableStore((state) => state.userTableObject)
  const loading = useUserTableStore((state) => state.loading)
  const fetchUserTableByName = useUserTableStore((state) => state.fetchUserTableByName)
  const { isFavorito, upsertFavorito, deleteFavorito } = useFavoritoContext()

  const hasObject = !!object?.name
  const currentFavorito = hasObject ? isFavorito(object.name, object.schemaName) : undefined

  const handleToggleFavorito = () => {
    if (!hasObject) return

    if (currentFavorito) {
      deleteFavorito(currentFavorito.schema, currentFavorito.objectName, currentFavorito.type)
    } else {
      upsertFavorito(object.schemaName, object.name, object.type, true)
    }
  }

  const handleRefresh = () => {
    if (!object || loading) return

    fetchUserTableByName(object.schemaName, object.name)
  }

  return (
    // En mobile el contenido no entra: en vez de solaparse, el header scrollea en horizontal
    <header className="bg-background flex h-14 items-center justify-between px-4 max-lg:overflow-x-auto max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-0 items-center gap-2 max-lg:min-w-max">
        {onOpenSidebar && <HeaderSidebarToggle onClick={onOpenSidebar} />}

        {hasObject ? (
          <div className="flex min-w-0 items-center gap-1">
            <ToggleFavoritoButton isFavorite={!!currentFavorito} onClick={handleToggleFavorito} />

            <ObjectName schemaName={object.schemaName} name={object.name} />
          </div>
        ) : (
          <div className="SY flex h-11 items-center text-[13px]"></div>
        )}

        <HeaderTabsUsertable />
      </div>

      {/* El buscador abre el modal global: va solo, separado de las acciones del objeto */}
      <div className="flex items-center gap-5 max-lg:shrink-0">
        <SearchTrigger />

        <div className="flex items-center gap-1">
          <RefreshObjectButton onClick={handleRefresh} disabled={!object || loading} label="Refrescar tabla" />
        </div>
      </div>
    </header>
  )
}
