import { useSearchContext } from '@aligment/hooks'
import { useAligmentStore } from '@aligment/zustand/aligment.store'
import Editor from '@monaco-editor/react'

import { CircleLoader } from '@/components/loader'
import { BaseMonacoEditorOptions } from '@/constants'
import { useEditorTheme } from '@/constants/monaco-themes/use-editor-theme'
import { EDITOR_BANNER } from '@/enviroment/enviroment'
import { getFormattedCodeForViewMode } from '@/utilities'
import { useAppStore, useEditorOptionsStore } from '@/zustand'

export function EditorCodeAligment() {
  const { renderWhitespace, fontSize, minimap, theme, stickyScroll, guides } = useEditorOptionsStore((state) => state)
  const isDark = useAppStore((state) => state.isDark)
  const viewMode = useAligmentStore((state) => state.viewMode)
  const sysobject = useAligmentStore((state) => state.sysobject)
  const updateCurrentEditorCode = useAligmentStore((state) => state.updateCurrentEditorCode)

  const { error, loading } = useSearchContext()
  let code = EDITOR_BANNER

  if (sysobject) code = getFormattedCodeForViewMode(sysobject, viewMode)
  if (error) code = error.detail

  // guarda siempre el código calculado del editor (para copiar)
  updateCurrentEditorCode(code)

  // define y aplica el tema seleccionado (carga perezosa, compartida)
  const { handleBeforeMount } = useEditorTheme(theme)

  const fullOptions = { ...BaseMonacoEditorOptions, renderWhitespace, fontSize, minimap, stickyScroll, guides }

  return (
    // `overflow-auto h-full` soluciona el error de desbordamiento
    <div className="group relative h-full w-full overflow-auto">
      <Editor
        beforeMount={handleBeforeMount}
        language={sysobject ? 'sql' : 'shell'}
        defaultValue={EDITOR_BANNER}
        theme={theme}
        value={!loading ? code : 'Buscando información, esto puede tardar unos segundos...'}
        options={{ ...fullOptions }}
        loading={<CircleLoader visible={true} color={isDark ? 'white' : 'black'} />}
      />
    </div>
  )
}
