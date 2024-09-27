import Editor from '@monaco-editor/react'
import Dracula from './themes/dracula.theme'
import { options } from './constants/editor-options'
import { useEditorStore } from '@/stores/editor-option.store'
import { useSQLDefinitionStore } from '@/stores/sqldefinition.store'

export function MonacoEditorCode() {
  const renderWhitespace = useEditorStore((state) => state.renderWhitespace)
  const SQLDefinitionCode = useSQLDefinitionStore(
    (state) => state.SQLDefinitionCode,
  )

  // cargar themes de monaco
  const handleEditorDidMount = (monaco) => {
    monaco.editor.defineTheme('dracula', {
      ...Dracula,
    })
  }

  const fullOptions = { ...options, renderWhitespace }

  return (
    <div>
      <Editor
        beforeMount={handleEditorDidMount}
        language="sql"
        defaultValue="// some comment"
        height="90vh"
        theme="dracula"
        value={SQLDefinitionCode}
        options={{ ...fullOptions }}
        loading={<div>Cargando...</div>}
      />
    </div>
  )
}
