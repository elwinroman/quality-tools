import Editor from '@monaco-editor/react'
import { useEffect } from 'react'

import { CircleLoader } from '@/components/loader'
import { BaseMonacoEditorOptions, resolveEditorThemePreference } from '@/constants'
import { useEditorTheme } from '@/constants/monaco-themes/use-editor-theme'
import { getFormattedCodeForViewMode } from '@/utilities'
import { useAppStore, useEditorOptionsStore } from '@/zustand'

import { useSysObjectStore } from '../store/sysobject.store'
import { SQLDefinitionEmptyState } from './SQLDefinitionEmptyState'

export function EditorCode() {
  const { renderWhitespace, fontSize, minimap, theme, themeMode, lightTheme, darkTheme, stickyScroll, guides } = useEditorOptionsStore(
    (state) => state,
  )
  const isDark = useAppStore((state) => state.isDark)
  const effectiveTheme = resolveEditorThemePreference({ theme, themeMode, lightTheme, darkTheme }, isDark)
  const isLoadingObject = useSysObjectStore((state) => state.isLoadingObject)
  const viewMode = useSysObjectStore((state) => state.viewMode)
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const updateCurrentEditorCode = useSysObjectStore((state) => state.updateCurrentEditorCode)

  const code = sysobject ? getFormattedCodeForViewMode(sysobject, viewMode) : ''

  // guarda siempre el código calculado del editor (para copiar)
  useEffect(() => {
    updateCurrentEditorCode(code)
  }, [code])

  // define y aplica el tema seleccionado (carga perezosa, compartida)
  const { handleBeforeMount } = useEditorTheme(effectiveTheme)

  const fullOptions = { ...BaseMonacoEditorOptions, renderWhitespace, fontSize, minimap, stickyScroll, guides }

  if (isLoadingObject) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <CircleLoader visible={true} color={isDark ? 'white' : 'black'} />
      </div>
    )
  }

  if (!sysobject) {
    return <SQLDefinitionEmptyState />
  }

  return (
    // `overflow-auto h-full` soluciona el error de desbordamiento
    <div className="group relative h-full w-full overflow-auto pt-1">
      <Editor
        beforeMount={handleBeforeMount}
        language="sql"
        theme={effectiveTheme}
        value={code}
        options={{ ...fullOptions }}
        loading={<CircleLoader visible={true} color={isDark ? 'white' : 'black'} />}
      />
    </div>
  )
}
