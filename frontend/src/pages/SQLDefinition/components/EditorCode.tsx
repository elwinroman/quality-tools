import Editor from '@monaco-editor/react'
import { Monaco } from '@monaco-editor/react'
import { useEffect } from 'react'

import { CircleLoader } from '@/components/loader'
import { BaseMonacoEditorOptions, MonacoThemes } from '@/constants'
import { ensureBuiltinTheme, getFormattedCodeForViewMode } from '@/utilities'
import { useAppStore, useEditorOptionsStore } from '@/zustand'

import { useSysObjectStore } from '../store/sysobject.store'
import { SQLDefinitionEmptyState } from './SQLDefinitionEmptyState'

export function EditorCode() {
  const { renderWhitespace, fontSize, minimap, theme, stickyScroll, guides } = useEditorOptionsStore((state) => state)
  const isDark = useAppStore((state) => state.isDark)
  const isLoadingObject = useSysObjectStore((state) => state.isLoadingObject)
  const viewMode = useSysObjectStore((state) => state.viewMode)
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const updateCurrentEditorCode = useSysObjectStore((state) => state.updateCurrentEditorCode)

  const code = sysobject ? getFormattedCodeForViewMode(sysobject, viewMode) : ''

  // guarda siempre el código calculado del editor (para copiar)
  useEffect(() => {
    updateCurrentEditorCode(code)
  }, [code])

  // cargar temas (estilos) de monaco
  const handleBeforeMount = (monaco: Monaco) => {
    for (const [keyTheme, valueTheme] of Object.entries(MonacoThemes)) {
      monaco.editor.defineTheme(keyTheme, {
        ...valueTheme.json,
        base: ensureBuiltinTheme(valueTheme.json.base),
      })
    }
  }

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
        theme={theme}
        value={code}
        options={{ ...fullOptions }}
        loading={<CircleLoader visible={true} color={isDark ? 'white' : 'black'} />}
      />
    </div>
  )
}
