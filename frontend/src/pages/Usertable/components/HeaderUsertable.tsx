import { ChevronRight } from 'lucide-react'

import { ToggleFavoritoButton, useFavoritoContext } from '@/components/favoritos'

import { useUserTableStore } from '../store/usertable.store'

export function HeaderUsertable() {
  const object = useUserTableStore((state) => state.userTableObject)
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
          <ToggleFavoritoButton isFavorite={!!currentFavorito} onClick={handleToggleFavorito} />
        </div>
      ) : (
        <div className="SY flex h-11 items-center text-[13px]"></div>
      )}
    </header>
  )
}
