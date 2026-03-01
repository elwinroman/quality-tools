import './styles/editor.style.css'

import type { Monaco } from '@monaco-editor/react'
import { DiffEditor } from '@monaco-editor/react'
import { OctagonAlert } from 'lucide-react'

import { CircleLoader } from '@/components/loader'
import { BaseMonacoEditorOptions, MonacoThemes } from '@/constants'
import { EDITOR_BANNER } from '@/enviroment/enviroment'
import { ensureBuiltinTheme, getFormattedCodeForViewMode } from '@/utilities'
import { useAppStore, useAuthStore, useEditorOptionsStore } from '@/zustand'

import { useSysObjectStore } from '../../../store/sysobject.store'
import { useInjectionComponent } from './useInjectionComponent'

const DIFF_EDITOR_BASE_OPTIONS = {
  originalEditable: false,
} as const

export function DiffEditorCode() {
  const { renderWhitespace, fontSize, renderSideBySide, theme, normalizeWhitespace, guides, minimap, stickyScroll } = useEditorOptionsStore(
    (state) => state,
  )
  const isDark = useAppStore((state) => state.isDark)
  const authContext = useAuthStore((state) => state.authContext)
  const viewMode = useSysObjectStore((state) => state.viewMode)
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const prodSysobject = useSysObjectStore((state) => state.prodSysobject)
  const isLoadingProdObject = useSysObjectStore((state) => state.isLoadingProdObject)
  const errorProdObject = useSysObjectStore((state) => state.errorProdObject)

  const normalizeCode = (code: string) => code.replace(/\t/g, '    ')

  // código del editor modificado (objeto actual)
  let modifiedCode = EDITOR_BANNER
  if (sysobject) {
    modifiedCode = getFormattedCodeForViewMode(sysobject, viewMode)
    if (normalizeWhitespace) modifiedCode = normalizeCode(modifiedCode)
  }

  // código del editor original (objeto pre-producción)
  let originalCode = ''
  if (prodSysobject) {
    originalCode = getFormattedCodeForViewMode(prodSysobject, viewMode)
    if (normalizeWhitespace) originalCode = normalizeCode(originalCode)
  }

  // marca de agua CSS para identificar las bases de datos
  if (authContext) {
    document.documentElement.style.setProperty('--aligment-database-content', JSON.stringify(authContext.prodDatabase))
    document.documentElement.style.setProperty('--current-database-content', JSON.stringify(authContext.database))
  }

  // cargar temas (estilos) de monaco
  const handleBeforeMount = (monaco: Monaco) => {
    for (const [keyTheme, valueTheme] of Object.entries(MonacoThemes)) {
      monaco.editor.defineTheme(keyTheme, {
        ...valueTheme.json,
        base: ensureBuiltinTheme(valueTheme.json.base),
      })
    }
  }

  // inyección de componentes (header + copy) dentro del DiffEditor
  const { render: injectComponents } = useInjectionComponent({ originalCode, modifiedCode, renderSideBySide })

  const fullOptions = {
    ...BaseMonacoEditorOptions,
    ...DIFF_EDITOR_BASE_OPTIONS,
    renderWhitespace,
    fontSize,
    renderSideBySide,
    ignoreTrimWhitespace: normalizeWhitespace,
    guides,
    minimap,
    stickyScroll,
  }

  if (errorProdObject) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3">
        <OctagonAlert size={32} className="text-red-500" />
        <h3 className="text-primary text-lg font-semibold">{errorProdObject.title}</h3>
        <p className="text-secondary max-w-md text-center text-sm">{errorProdObject.detail}</p>
      </div>
    )
  }

  if (isLoadingProdObject) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <CircleLoader visible={true} color={isDark ? 'white' : 'black'} />
      </div>
    )
  }

  return (
    <div className="group relative h-full w-full overflow-auto pt-1">
      <DiffEditor
        beforeMount={handleBeforeMount}
        onMount={injectComponents}
        language="sql"
        theme={theme}
        original={originalCode}
        modified={modifiedCode}
        options={{ ...fullOptions }}
        loading={<CircleLoader visible={true} color={isDark ? 'white' : 'black'} />}
      />
    </div>
  )
}
