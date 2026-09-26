import { PanelLeft, RefreshCw } from 'lucide-react'

import { ToggleFavoritoButton, useFavoritoContext } from '@/components/favoritos'
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'

import { useUserTableStore } from '../store/usertable.store'

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
    <header className="bg-background flex items-center justify-between px-4 pt-2 pb-3">
      {/* Breadcrumb */}
      <div className="flex min-w-0 items-center gap-2">
        {onOpenSidebar && (
          <button
            type="button"
            className="hover:bg-background-neutral shrink-0 rounded-sm px-1 py-1"
            onClick={onOpenSidebar}
            aria-label="Mostrar panel lateral"
          >
            <PanelLeft size={16} />
          </button>
        )}

        {hasObject ? (
          <div className="flex min-w-0 items-center gap-1">
            <ToggleFavoritoButton isFavorite={!!currentFavorito} onClick={handleToggleFavorito} />

            <span className="flex min-w-0 items-center gap-1 text-sm">
              <span className="text-secondary shrink-0">{object.schemaName}</span>
              <span className="text-primary min-w-0 truncate font-semibold">{object.name}</span>
            </span>
          </div>
        ) : (
          <div className="SY flex h-11 items-center text-[13px]"></div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!object || loading} onClick={handleRefresh}>
                <RefreshCw size={14} className="text-primary" />
              </Button>
            </TooltipTrigger>
            {object && (
              <TooltipContent side="bottom">
                <p>Refrescar tabla</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  )
}
