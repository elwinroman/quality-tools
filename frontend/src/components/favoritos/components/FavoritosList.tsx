import { Circle, CircleOff, X } from 'lucide-react'

import { cn } from '@/lib/utils'

import { type FavoriteScopeKind, type Favorito, scopeKindFrom } from '../models/favorito.model'
import { FavoritosGroup } from './FavoritosGroup'

interface Props {
  favoritos: Favorito[]
  onDelete(schema: string, objectName: string, type: string, scope: FavoriteScopeKind): void
  onSelect(schema: string, name: string): void
  activeObjectName?: string
  activeSchema?: string
}

/** Etiqueta base de cada grupo de alcance. */
const GROUP_LABELS: Record<FavoriteScopeKind, string> = {
  global: 'Globales',
  server: 'Servidor',
  database: 'BD actual',
}

/** Orden de presentación: del alcance más amplio al más específico. */
const GROUP_ORDER: FavoriteScopeKind[] = ['global', 'server', 'database']

interface FavoriteGroup {
  kind: FavoriteScopeKind
  favoritos: Favorito[]
}

/** Agrupa por alcance y descarta los grupos vacíos. */
function groupByScope(favoritos: Favorito[]): FavoriteGroup[] {
  const byKind: Record<FavoriteScopeKind, Favorito[]> = {
    global: [],
    server: [],
    database: [],
  }
  for (const fav of favoritos) {
    byKind[scopeKindFrom(fav.scope)].push(fav)
  }
  return GROUP_ORDER.filter((kind) => byKind[kind].length > 0).map((kind) => ({
    kind,
    favoritos: byKind[kind],
  }))
}

/**
 * Etiqueta del grupo. El nombre del servidor se agrega porque aporta contexto; el de
 * la base no: es redundante, ya que estás parado en esa base.
 */
function groupLabel(group: FavoriteGroup): string {
  const base = GROUP_LABELS[group.kind]
  const serverName = group.kind === 'server' ? group.favoritos[0].scope.serverName : null
  return serverName ? `${base} · ${serverName}` : base
}

export function FavoritosList({ favoritos, onDelete, onSelect, activeObjectName, activeSchema }: Props) {
  const isActive = (fav: Favorito) => activeObjectName === fav.objectName && activeSchema === fav.schema

  const handleClick = (objectId: number | null, schema: string, name: string) => {
    if (objectId === null) return
    onSelect(schema, name)
  }

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>, fav: Favorito) => {
    e.stopPropagation()
    onDelete(fav.schema, fav.objectName, fav.type, scopeKindFrom(fav.scope))
  }

  if (favoritos.length === 0) {
    return (
      <ul className="flex flex-col gap-0.5">
        <li className="text-secondary px-4 py-2 text-xs">Sin favoritos aún</li>
      </ul>
    )
  }

  const groups = groupByScope(favoritos)

  return (
    <ul className="flex flex-col gap-0.5">
      {groups.map((group) => {
        const label = groupLabel(group)

        return (
          <FavoritosGroup key={group.kind} label={label} count={group.favoritos.length}>
            {group.favoritos.map((fav) => {
              const inactive = fav.objectId === null

              return (
                <li
                  key={fav.id}
                  title={inactive ? 'El objeto no existe en la base actual' : undefined}
                  className={cn('group/fav relative ml-3 rounded-sm', isActive(fav) && 'bg-action-hover', inactive && 'opacity-60')}
                >
                  <button
                    type="button"
                    disabled={inactive}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-[13px]',
                      inactive ? 'cursor-not-allowed' : 'hover:bg-action-hover cursor-pointer',
                    )}
                    onClick={() => handleClick(fav.objectId, fav.schema, fav.objectName)}
                  >
                    {inactive ? (
                      <CircleOff size={8} className="text-secondary shrink-0" />
                    ) : (
                      <Circle
                        size={8}
                        className={cn('shrink-0', isActive(fav) ? 'text-primary' : 'text-secondary group-hover/fav:text-primary')}
                      />
                    )}
                    <span
                      className={cn(
                        'truncate text-[13px]',
                        inactive ? 'text-secondary' : isActive(fav) ? 'text-primary' : 'text-primary/60 group-hover/fav:text-primary',
                      )}
                    >
                      {fav.objectName}
                    </span>
                  </button>

                  <button
                    type="button"
                    title="Quitar de favoritos"
                    className="text-primary absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer opacity-0 transition-opacity group-hover/fav:opacity-100"
                    onClick={(e) => handleDelete(e, fav)}
                  >
                    <X size={14} />
                  </button>
                </li>
              )
            })}
          </FavoritosGroup>
        )
      })}
    </ul>
  )
}
