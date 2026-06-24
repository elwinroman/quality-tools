import { ChevronRight, RefreshCw, Table2 } from 'lucide-react'

import { ToggleFavoritoButton, useFavoritoContext } from '@/components/favoritos'
import { Badge, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'

import { useUserTableStore } from '../store/usertable.store'

export function HeaderUsertable() {
  const object = useUserTableStore((state) => state.userTableObject)
  const loading = useUserTableStore((state) => state.loading)
  const fetchUserTableByName = useUserTableStore((state) => state.fetchUserTableByName)
  const { isFavorito, upsertFavorito, deleteFavorito } = useFavoritoContext()

  const hasObject = !!object?.name
  const currentFavorito = hasObject ? isFavorito(object.name, object.schemaName) : undefined

  const handleToggleFavorito = () => {
    if (!hasObject) return

    if (currentFavorito) {
      deleteFavorito(currentFavorito.id)
    } else {
      upsertFavorito(object.schemaName, object.name, object.type)
    }
  }

  const handleRefresh = () => {
    if (!object || loading) return

    fetchUserTableByName(object.schemaName, object.name)
  }

  return (
    <header className="bg-background flex items-center justify-between px-4 pt-2 pb-3">
      {/* Breadcrumb */}
      {hasObject ? (
        <div className="flex items-center gap-1">
          <ul className="text-secondary SY flex items-center gap-0.5 font-bold">
            <li>{object.schemaName}</li>
            <li>
              <ChevronRight size={14} className="place-self-center-safe" />
            </li>
            <li className="text-primary overflow-hidden">{object.name}</li>
          </ul>
          <Badge variant="outline" className="text-muted ml-2 gap-1 border-dashed font-medium">
            <Table2 size={11} />
            Usertable
          </Badge>
          <ToggleFavoritoButton isFavorite={!!currentFavorito} onClick={handleToggleFavorito} />
        </div>
      ) : (
        <div className="SY flex h-11 items-center text-[13px]"></div>
      )}

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
