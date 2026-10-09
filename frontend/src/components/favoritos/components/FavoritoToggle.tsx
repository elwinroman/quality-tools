import { Database, Globe, type LucideIcon, Star } from 'lucide-react'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { cn } from '@/lib/utils'

import { useFavoritoContext } from '../contexts/favoritoContext'
import { FAVORITE_SCOPE_LABELS, type FavoriteScopeKind } from '../models/favorito.model'

interface FavoritoToggleObject {
  schemaName: string
  name: string
  type: string
}

interface Props {
  object: FavoritoToggleObject
  size?: number
}

/** Textos del tooltip según el estado del segmento. */
const ACTION_LABELS = {
  add: 'Agregar a favoritos',
  remove: 'Quitar de favoritos',
} as const

/** Alcances con segmento visible. `server` está diferido (fase 2). */
type VisibleScopeKind = Exclude<FavoriteScopeKind, 'server'>

interface ScopeSegment {
  kind: VisibleScopeKind
  label: string
  icon: LucideIcon
}

/**
 * Segmentos en orden de presentación. El contenedor es flex, así que sumar el
 * tercer segmento "Servidor" solo requiere una entrada más acá.
 */
const SCOPE_SEGMENTS: ScopeSegment[] = [
  { kind: 'global', label: FAVORITE_SCOPE_LABELS.global, icon: Globe },
  { kind: 'database', label: FAVORITE_SCOPE_LABELS.database, icon: Database },
]

/**
 * Control segmentado de alcance del favorito. Siempre visible y con un único
 * alcance activo a la vez: tocar el segmento activo quita el favorito y tocar
 * uno inactivo lo agrega en ese alcance (o lo mueve si ya estaba en el otro).
 */
export function FavoritoToggle({ object, size = 14 }: Props) {
  const { findFavorito, upsertFavorito, deleteFavorito, moveFavorito } = useFavoritoContext()

  // Solo se consideran los alcances con segmento visible: un favorito `server`
  // legado se ignora a propósito (el segmento Servidor está diferido).
  const globalFav = findFavorito(object.name, object.schemaName, 'global')
  const databaseFav = findFavorito(object.name, object.schemaName, 'database')
  const activeFav = databaseFav ?? globalFav
  const activeScope: FavoriteScopeKind | null = databaseFav ? 'database' : globalFav ? 'global' : null

  const handleSelect = (kind: VisibleScopeKind) => {
    if (kind === activeScope) {
      deleteFavorito(object.schemaName, object.name, object.type, kind)
      return
    }

    if (activeFav) {
      moveFavorito(activeFav, kind)
      return
    }

    upsertFavorito(object.schemaName, object.name, object.type, true, kind)
  }

  return (
    <TooltipProvider>
      <div className="border-border flex h-7 items-center overflow-hidden rounded-sm border">
        {SCOPE_SEGMENTS.map(({ kind, label, icon: Icon }) => {
          const active = kind === activeScope
          const action = active ? ACTION_LABELS.remove : ACTION_LABELS.add

          return (
            <Tooltip key={kind} delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-pressed={active}
                  aria-label={label}
                  onClick={(event) => {
                    event.stopPropagation()
                    handleSelect(kind)
                  }}
                  className={cn(
                    'flex h-7 items-center gap-1 px-2 text-xs font-medium transition-colors',
                    active ? 'bg-action-hover text-primary' : 'text-secondary hover:bg-action-hover',
                  )}
                >
                  <Icon size={size} className="text-secondary shrink-0" />
                  <Star size={size} className={cn('shrink-0', active ? 'fill-yellow-400 text-yellow-400' : 'text-secondary')} />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{`${action} (${label})`}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
