import { useAligmentStore } from '@aligment/zustand/aligment.store'

import { EditorOptions, HeaderSidebarToggle, ObjectName } from '@/components/editor-header'

export function HeaderEditor() {
  const hideMenu = useAligmentStore((state) => state.hideMenu)
  const updateHideMenu = useAligmentStore((state) => state.updateHideMenu)
  const sysobject = useAligmentStore((state) => state.sysobject)
  const currentEditorCode = useAligmentStore((state) => state.currentEditorCode)
  const viewMode = useAligmentStore((state) => state.viewMode)
  const updateViewMode = useAligmentStore((state) => state.updateViewMode)

  return (
    <header className="dark:bg-background bg-action-hover flex flex-col justify-start gap-x-5 gap-y-2 px-4 py-2.5 sm:items-center lg:flex-row lg:justify-between">
      {/* El sidebar se colapsa desde su propio header; aca solo se lo vuelve a mostrar */}
      {hideMenu && <HeaderSidebarToggle onClick={() => updateHideMenu(!hideMenu)} />}

      <div className="flex flex-[0_0_auto] flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <ObjectName schemaName={sysobject?.schemaName ?? ''} name={sysobject?.name ?? ''} />

          <span className="border-palette-primary-main/20 bg-palette-primary-main/10 text-palette-primary-dark dark:border-palette-primary-main/30 dark:bg-palette-primary-main/15 dark:text-palette-primary-light inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-xs font-medium">
            <span className="bg-palette-primary-main h-1.5 w-1.5 rounded-full" />
            Producción
          </span>
        </div>
      </div>

      {/* Opciones del editor */}
      <div className="flex flex-[1_1_0] flex-wrap items-center gap-x-3 gap-y-2 sm:justify-end sm:gap-x-5 sm:gap-y-4">
        <EditorOptions
          object={{ schema: sysobject?.schemaName ?? '', name: sysobject?.name ?? '', type: sysobject?.type ?? '' }}
          code={currentEditorCode}
          viewMode={viewMode}
          onViewModeChange={updateViewMode}
        />
      </div>
    </header>
  )
}
