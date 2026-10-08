import type { Monaco } from '@monaco-editor/react'
import { useCallback, useEffect, useState } from 'react'

import { ensureThemeDefined, type IMonacoThemeId } from './monaco-themes'

/**
 * Contador global de solicitudes de tema.
 *
 * `monaco.editor.setTheme` es global al runtime de Monaco, no por instancia, y
 * los tres editores (SQLDefinition, diff y Alignment) pueden estar montados a
 * la vez. Por eso la proteccion de carrera no puede ser por hook: si cada
 * instancia solo comparara su propia solicitud, la resolucion lenta de una
 * instancia podria pisar el tema mas reciente pedido por otra.
 */
let latestThemeRequest = 0

/** Ultimo tema aplicado con exito; evita repetir `setTheme` con el mismo valor. */
let appliedTheme: IMonacoThemeId | null = null

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
 * La proteccion de carrera es global: solo la ultima solicitud emitida por
 * cualquier editor puede aplicar el tema.
 */
export const useEditorTheme = (theme: IMonacoThemeId) => {
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null)

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    setMonacoInstance(monaco)
  }, [])

  useEffect(() => {
    if (!monacoInstance) return

    latestThemeRequest += 1
    const requestId = latestThemeRequest
    let cancelled = false

    ensureThemeDefined(monacoInstance, theme)
      .then(() => {
        // Solo la ultima solicitud global puede aplicar el tema.
        if (cancelled || requestId !== latestThemeRequest) return
        if (appliedTheme === theme) return

        monacoInstance.editor.setTheme(theme)
        appliedTheme = theme
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
