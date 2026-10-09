import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

import type { FavoriteScopeKind, Favorito } from '../models/favorito.model'
import { FavoritosList } from './FavoritosList'

interface Props {
  favoritos: Favorito[]
  onDelete(schema: string, objectName: string, type: string, scope: FavoriteScopeKind): void
  onSelect(schema: string, name: string): void
  activeObjectName?: string
  activeSchema?: string
  /** Al cambiar, vuelve a la pantalla principal (p. ej. al plegar el sidebar). */
  resetSignal?: number
}

type Screen = 'main' | 'favorites'

/**
 * Navegación push/pop de favoritos dentro del sidebar, al estilo Vercel.
 * La pantalla principal es una fila "Favoritos" con contador y chevron; el clic
 * empuja la pantalla de grupos y la cabecera "‹ Favoritos" vuelve atrás.
 * Las dos pantallas viven en una pista horizontal que se desliza con translateX.
 */
export function FavoritosNav({ favoritos, onDelete, onSelect, activeObjectName, activeSchema, resetSignal }: Props) {
  const [screen, setScreen] = useState<Screen>('main')
  const isFavorites = screen === 'favorites'
  const count = favoritos.length
  const mainPaneRef = useRef<HTMLDivElement>(null)
  const listPaneRef = useRef<HTMLDivElement>(null)

  // Vuelve a la pantalla principal cuando el sidebar se pliega o se navega,
  // para no reabrir a mitad del drill-down.
  useEffect(() => {
    setScreen('main')
  }, [resetSignal])

  // La pantalla inactiva sale del orden de tabulación con `inert`. React 18 no
  // soporta la prop booleana, así que el atributo se maneja directo en el DOM;
  // realza al `aria-hidden` que ya la saca del árbol de accesibilidad.
  useEffect(() => {
    mainPaneRef.current?.toggleAttribute('inert', isFavorites)
    listPaneRef.current?.toggleAttribute('inert', !isFavorites)
  }, [isFavorites])

  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <div
        className={cn(
          'flex h-full w-full transition-transform duration-300 ease-in-out',
          isFavorites ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        {/* Pantalla principal: entrada única "Favoritos" con contador y chevron */}
        <div ref={mainPaneRef} className="h-full w-full shrink-0" data-testid="favoritos-nav-main" aria-hidden={isFavorites}>
          <button
            type="button"
            className="group/favnav hover:bg-action-hover flex w-full items-center gap-2 rounded-sm px-2 py-2 text-left"
            onClick={() => setScreen('favorites')}
          >
            <span className="text-primary/60 group-hover/favnav:text-primary min-w-0 truncate text-sm font-semibold">Favoritos</span>
            {count > 0 && <span className="text-secondary group-hover/favnav:text-primary shrink-0 text-[11px]">{count}</span>}
            <ChevronRight size={14} className="text-secondary ml-auto shrink-0" />
          </button>
        </div>

        {/* Pantalla de favoritos: cabecera atrás + grupos como hijos */}
        <div ref={listPaneRef} className="flex h-full w-full shrink-0 flex-col" data-testid="favoritos-nav-list" aria-hidden={!isFavorites}>
          <button
            type="button"
            aria-label="Volver a Favoritos"
            className="group/back hover:bg-action-hover flex shrink-0 items-center gap-1 rounded-sm px-2 py-2 text-left"
            onClick={() => setScreen('main')}
          >
            <ChevronLeft size={14} className="text-secondary group-hover/back:text-primary shrink-0" />
            <span className="text-primary/60 group-hover/back:text-primary truncate text-sm font-semibold">Favoritos</span>
          </button>

          <FavoritosList
            favoritos={favoritos}
            onDelete={onDelete}
            onSelect={onSelect}
            activeObjectName={activeObjectName}
            activeSchema={activeSchema}
          />
        </div>
      </div>
    </div>
  )
}
