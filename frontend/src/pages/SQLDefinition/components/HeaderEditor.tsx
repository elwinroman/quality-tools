import { TriangleAlert } from 'lucide-react'

import { EditorOptions, HeaderSidebarToggle, ObjectName, RefreshObjectButton } from '@/components/editor-header'
import { ToggleFavoritoButton, useFavoritoContext } from '@/components/favoritos'
import { SearchTrigger } from '@/components/search/components/SearchTrigger'
import { useEditorOptionsStore } from '@/zustand'

import { TabOption } from '../constants/tabs-options'
import { useSysObjectStore } from '../store/sysobject.store'
import { NormalizeWhitespaceToggle } from './diff-script-content/components/NormalizeWhitespaceToggle'
import { SideBySideToggle } from './diff-script-content/components/SideBySideToggle'
import { HeaderTabs } from './HeaderTabs'

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
    // En mobile el contenido no entra: en vez de solaparse, el header scrollea en horizontal
    <header className="bg-background flex h-14 items-center justify-between px-4 max-lg:overflow-x-auto max-lg:[scrollbar-width:none] max-lg:[&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-0 items-center gap-4 max-lg:min-w-max">
        {onOpenSidebar && <HeaderSidebarToggle onClick={onOpenSidebar} />}

        {sysobject ? (
          <div className="flex min-w-0 items-center gap-1">
            <ToggleFavoritoButton isFavorite={!!currentFavorito} onClick={handleToggleFavorito} />

            <ObjectName schemaName={sysobject.schemaName} name={sysobject.name} />
          </div>
        ) : (
          <div className="SY flex h-11 items-center text-[13px]"></div>
        )}

        <HeaderTabs />
      </div>

      {isComparing && normalizeWhitespace && (
        <div className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-amber-400/80">
          <TriangleAlert size={11} />
          <span>Vista modificada · whitespace normalizado</span>
        </div>
      )}

      {/* El buscador abre el modal global: va solo, separado de las acciones del objeto */}
      <div className="flex items-center gap-5 max-lg:shrink-0">
        <SearchTrigger />

        <div className="flex items-center gap-1">
          <RefreshObjectButton onClick={handleRefresh} disabled={!sysobject || isLoadingObject} label="Refrescar objeto" />

          {isComparing && (
            <>
              <NormalizeWhitespaceToggle />
              <SideBySideToggle />
            </>
          )}

          <EditorOptions
            object={{ schema: sysobject?.schemaName ?? '', name: sysobject?.name ?? '', type: sysobject?.type ?? '' }}
            code={currentEditorCode}
            viewMode={viewMode}
            onViewModeChange={updateViewMode}
            showObjectActions={!isComparing}
            showViewMode={showViewMode}
          />
        </div>
      </div>
    </header>
  )
}
