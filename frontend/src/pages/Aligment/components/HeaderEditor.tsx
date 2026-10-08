import { useAligmentStore } from '@aligment/zustand/aligment.store'

import { EditorOptions, HeaderSidebarToggle, ObjectEditorHeader, ObjectName } from '@/components/editor-header'

export function HeaderEditor() {
  const hideMenu = useAligmentStore((state) => state.hideMenu)
  const updateHideMenu = useAligmentStore((state) => state.updateHideMenu)
  const sysobject = useAligmentStore((state) => state.sysobject)
  const currentEditorCode = useAligmentStore((state) => state.currentEditorCode)
  const viewMode = useAligmentStore((state) => state.viewMode)
  const updateViewMode = useAligmentStore((state) => state.updateViewMode)

  return (
    <ObjectEditorHeader
      left={
        <div className="flex min-w-0 items-center gap-4 max-lg:min-w-max">
          {/* El sidebar se colapsa desde su propio header; acá solo se lo vuelve a mostrar. */}
          {hideMenu && <HeaderSidebarToggle onClick={() => updateHideMenu(!hideMenu)} />}

          <div className="flex min-w-0 items-center gap-2">
            <ObjectName schemaName={sysobject?.schemaName ?? ''} name={sysobject?.name ?? ''} />

            <span className="text-muted shrink-0 text-sm whitespace-nowrap">· Producción</span>
          </div>
        </div>
      }
      actions={
        <div className="flex items-center gap-1 max-lg:shrink-0">
          <EditorOptions
            object={{ schema: sysobject?.schemaName ?? '', name: sysobject?.name ?? '', type: sysobject?.type ?? '' }}
            code={currentEditorCode}
            viewMode={viewMode}
            onViewModeChange={updateViewMode}
          />
        </div>
      }
    />
  )
}
