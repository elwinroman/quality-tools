import { ChevronRight, Code2, RefreshCw, TriangleAlert } from 'lucide-react'

import { ConfigOptionEditor, CopyCode, GenerateCodeForDropObject } from '@/components/editor-option'
import { ToggleFavoritoButton, useFavoritoContext } from '@/components/favoritos'
import { Badge, Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui'
import { useEditorOptionsStore } from '@/zustand'

import { TabOption } from '../constants/tabs-options'
import { useSysObjectStore } from '../store/sysobject.store'
import { NormalizeWhitespaceToggle } from './diff-script-content/components/NormalizeWhitespaceToggle'
import { SideBySideToggle } from './diff-script-content/components/SideBySideToggle'

interface Props {
  activeTab: string
}

export function HeaderEditor({ activeTab }: Props) {
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const isLoadingObject = useSysObjectStore((state) => state.isLoadingObject)
  const currentEditorCode = useSysObjectStore((state) => state.currentEditorCode)
  const fetchSysObjectByName = useSysObjectStore((state) => state.fetchSysObjectByName)
  const normalizeWhitespace = useEditorOptionsStore((state) => state.normalizeWhitespace)
  const { isFavorito, upsertFavorito, deleteFavorito } = useFavoritoContext()

  const isComparing = activeTab === TabOption.Compare
  const currentFavorito = sysobject ? isFavorito(sysobject.name, sysobject.schemaName) : undefined

  const handleToggleFavorito = () => {
    if (!sysobject) return

    if (currentFavorito) {
      deleteFavorito(currentFavorito.id)
    } else {
      upsertFavorito(sysobject.schemaName, sysobject.name, sysobject.type)
    }
  }

  const handleRefresh = () => {
    if (!sysobject || isLoadingObject) return

    fetchSysObjectByName(sysobject.schemaName, sysobject.name)
  }

  return (
    <header className="bg-background flex items-center justify-between px-4 pt-2 pb-3">
      {/* Breadcrumb */}
      {sysobject ? (
        <div className="flex items-center gap-1">
          <ul className="text-secondary SY flex items-center gap-0.5 font-bold">
            <li>{sysobject.schemaName}</li>
            <li>
              <ChevronRight size={14} className="place-self-center-safe" />
            </li>
            <li className="text-primary overflow-hidden">{sysobject.name}</li>
          </ul>
          <Badge variant="outline" className="text-muted ml-2 gap-1 border-dashed font-medium">
            <Code2 size={11} />
            SQL Definition
          </Badge>
          <ToggleFavoritoButton isFavorite={!!currentFavorito} onClick={handleToggleFavorito} />
        </div>
      ) : (
        <div className="SY flex h-11 items-center text-[13px]"></div>
      )}

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
      </div>
    </header>
  )
}
