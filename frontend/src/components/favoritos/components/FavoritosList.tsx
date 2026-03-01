import { CircleDashed, CircleOff, X } from 'lucide-react'

import { cn } from '@/lib/utils'

import type { Favorito } from '../models/favorito.model'
import { CollapsibleSection } from './CollapsibleSection'

interface Props {
  favoritos: Favorito[]
  onDelete(id: number): void
  onSelect(objectId: number): void
  activeObjectName?: string
  activeSchema?: string
}

export function FavoritosList({ favoritos, onDelete, onSelect, activeObjectName, activeSchema }: Props) {
  const isActive = (fav: Favorito) => activeObjectName === fav.objectName && activeSchema === fav.schema

  const handleClick = (objectId: number | null) => {
    if (objectId === null) return
    onSelect(objectId)
  }

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation()
    onDelete(id)
  }

  if (favoritos.length === 0) {
    return (
      <CollapsibleSection title="Favoritos">
        <li className="text-secondary px-4 py-2 text-xs">Sin favoritos aún</li>
      </CollapsibleSection>
    )
  }

  return (
    <CollapsibleSection title="Favoritos">
      {favoritos.map((fav) => {
        const inactive = fav.objectId === null

        return (
          <li key={fav.id} className={cn('group/fav relative mx-2 rounded-sm', isActive(fav) && 'bg-action-hover')}>
            <button
              type="button"
              disabled={inactive}
              className={cn(
                'flex w-full items-center gap-2 rounded-sm px-4 py-1.5 text-left text-[13px]',
                inactive ? 'cursor-not-allowed' : 'hover:bg-action-hover cursor-pointer',
              )}
              onClick={() => handleClick(fav.objectId)}
            >
              {inactive ? (
                <CircleOff size={14} className="text-destructive shrink-0" />
              ) : (
                <CircleDashed
                  size={14}
                  className={cn('shrink-0', isActive(fav) ? 'text-primary' : 'text-secondary group-hover/fav:text-primary')}
                />
              )}
              <span
                className={cn(
                  'truncate text-[13px]',
                  inactive
                    ? 'text-secondary line-through'
                    : isActive(fav)
                      ? 'text-primary'
                      : 'text-primary/60 group-hover/fav:text-primary',
                )}
              >
                {fav.objectName}
              </span>
              {inactive && (
                <span className="bg-destructive/20 text-destructive shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none font-semibold">
                  NO DISPONIBLE
                </span>
              )}
            </button>

            <button
              type="button"
              title="Quitar de favoritos"
              className="text-primary absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer opacity-0 transition-opacity group-hover/fav:opacity-100"
              onClick={(e) => handleDelete(e, fav.id)}
            >
              <X size={14} />
            </button>
          </li>
        )
      })}
    </CollapsibleSection>
  )
}
