import { useCallback, useSyncExternalStore } from 'react'

// En SSR no hay `window`: se asume una pantalla grande y el cliente corrige al hidratar.
const getServerSnapshot = () => false

/**
 * Evalúa si una media query del navegador coincide con el estado actual de la ventana.
 * @param {string} query - Media query a evaluar (ej. '(min-width: 64rem)').
 * @returns {boolean} `true` si la media query coincide.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener('change', onChange)

      return () => mediaQueryList.removeEventListener('change', onChange)
    },
    [query],
  )

  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
