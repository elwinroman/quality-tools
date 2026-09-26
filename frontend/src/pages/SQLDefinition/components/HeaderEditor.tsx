import { PanelLeft, RefreshCw, TriangleAlert } from 'lucide-react'

import { ConfigOptionEditor, CopyCode, GenerateCodeForDropObject } from '@/components/editor-option'
import { ToggleFavoritoButton, useFavoritoContext } from '@/components/favoritos'
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { ViewModeSelect } from '@/components/view-mode-select'
import { useEditorOptionsStore } from '@/zustand'

import { TabOption } from '../constants/tabs-options'
import { useSysObjectStore } from '../store/sysobject.store'
import { NormalizeWhitespaceToggle } from './diff-script-content/components/NormalizeWhitespaceToggle'
import { SideBySideToggle } from './diff-script-content/components/SideBySideToggle'

interface Props {
  activeTab: string
  onOpenSidebar?: () => void
}

export function HeaderEditor({ activeTab, onOpenSidebar }: Props) {
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const viewMode = useSysObjectStore((state) => state.viewMode)
  const updateViewMode = useSysObjectStore((state) => state.updateViewMode)
  const isLoadingObject = useSysObjectStore((state) => state.isLoadingObject)
  const currentEditorCode = useSysObjectStore((state) => state.currentEditorCode)
  const fetchSysObjectByName = useSysObjectStore((state) => state.fetchSysObjectByName)
  const normalizeWhitespace = useEditorOptionsStore((state) => state.normalizeWhitespace)
  const { isFavorito, upsertFavorito, deleteFavorito } = useFavoritoContext()

  const isComparing = activeTab === TabOption.Compare
  // La vista solo aplica a los tabs que muestran código
  const showViewMode = activeTab === TabOption.Script || isComparing
  const currentFavorito = sysobject ? isFavorito(sysobject.name, sysobject.schemaName) : undefined

  const handleToggleFavorito = () => {
    if (!sysobject) return

    if (currentFavorito) {
      deleteFavorito(currentFavorito.schema, currentFavorito.objectName, currentFavorito.type)
    } else {
      upsertFavorito(sysobject.schemaName, sysobject.name, sysobject.type, true)
    }
  }

  const handleRefresh = () => {
    if (!sysobject || isLoadingObject) return

    fetchSysObjectByName(sysobject.schemaName, sysobject.name)
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

        {sysobject ? (
          <div className="flex min-w-0 items-center gap-1">
            <ToggleFavoritoButton isFavorite={!!currentFavorito} onClick={handleToggleFavorito} />

            <span className="flex min-w-0 items-center gap-1 text-sm">
              <span className="text-secondary shrink-0">{sysobject.schemaName}</span>
              <span className="text-primary min-w-0 truncate font-semibold">{sysobject.name}</span>
            </span>
          </div>
        ) : (
          <div className="SY flex h-11 items-center text-[13px]"></div>
        )}
      </div>

      {/* Aviso normalización activa */}
      {isComparing && normalizeWhitespace && (
        <div className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-amber-400/80">
          <TriangleAlert size={11} />
          <span>Vista modificada · whitespace normalizado</span>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!sysobject || isLoadingObject} onClick={handleRefresh}>
                <RefreshCw size={14} className="text-primary" />
              </Button>
            </TooltipTrigger>
            {sysobject && (
              <TooltipContent side="bottom">
                <p>Refrescar objeto</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>

        {isComparing ? (
          <>
            <NormalizeWhitespaceToggle />
            <SideBySideToggle />
          </>
        ) : (
          <>
            {/* <DownloadScript text={sysobject?.definition ?? ''} disabled={!sysobject} filename={sysobject?.name ?? ''} /> */}
            <GenerateCodeForDropObject
              object={{ schema: sysobject?.schemaName ?? '', name: sysobject?.name ?? '', type: sysobject?.type ?? '' }}
              disabled={!sysobject}
            />
            <CopyCode text={currentEditorCode} disabled={!sysobject} />
          </>
        )}

        <ConfigOptionEditor />

        {showViewMode && <ViewModeSelect value={viewMode} onChange={updateViewMode} />}
      </div>
    </header>
  )
}
