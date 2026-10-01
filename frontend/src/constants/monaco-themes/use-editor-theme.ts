import type { Monaco } from '@monaco-editor/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ensureThemeDefined, type IMonacoThemeId } from './monaco-themes'

/**
 * Hook compartido por los editores de Monaco de la app.
 *
 * Define (de forma perezosa) y aplica el tema seleccionado. Se conserva el
 * `beforeMount` para que el editor siga recibiendo un `theme` valido, pero la
 * aplicacion real del tema espera a que su JSON termine de cargar.
 *
 * Comportamiento del primer render: el tema se resuelve de forma asincrona, por
 * lo que durante un tick Monaco usa su tema por defecto antes de que el tema
 * elegido quede definido y aplicado. Es un intercambio consciente a cambio de no
 * incluir los ~55 JSON de temas en el bundle inicial.
 *
 * La proteccion de carrera garantiza que, si el usuario cambia de tema varias
 * veces, solo la ultima resolucion solicitada aplique el tema.
 */
export const useEditorTheme = (theme: IMonacoThemeId) => {
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null)
  const latestRequest = useRef(0)

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    setMonacoInstance(monaco)
  }, [])

  useEffect(() => {
    if (!monacoInstance) return

    const requestId = latestRequest.current + 1
    latestRequest.current = requestId
    let cancelled = false

    ensureThemeDefined(monacoInstance, theme)
      .then(() => {
        // Solo la ultima resolucion solicitada puede aplicar el tema.
        if (cancelled || requestId !== latestRequest.current) return
        monacoInstance.editor.setTheme(theme)
      })
      .catch((error) => {
        console.error(`[Monaco Theme] No se pudo cargar el tema "${theme}".`, error)
      })

    return () => {
      cancelled = true
    }
  }, [monacoInstance, theme])

  return { handleBeforeMount }
}
