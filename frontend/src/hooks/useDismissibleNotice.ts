import { useCallback, useState } from 'react'

const DAY_IN_MS = 24 * 60 * 60 * 1000

function readDismissedAt(storageKey: string): number {
  try {
    return Number(window.localStorage.getItem(storageKey)) || 0
  } catch {
    return 0
  }
}

function writeDismissedAt(storageKey: string, value: number): void {
  try {
    window.localStorage.setItem(storageKey, String(value))
  } catch {
    // Si el almacenamiento no está disponible, el aviso simplemente vuelve a mostrarse.
  }
}

/**
 * Recuerda si un aviso fue cerrado para no volver a mostrarlo durante un tiempo.
 *
 * Guarda la marca de tiempo en localStorage y lo vuelve a mostrar pasado el TTL, así
 * reaparece cada tanto en vez de en cada refresco. Con `ttlDays = 0` queda cerrado
 * para siempre.
 */
export function useDismissibleNotice(key: string, ttlDays = 7) {
  const storageKey = `dismissible-notice:${key}`

  const [isVisible, setIsVisible] = useState(() => {
    const dismissedAt = readDismissedAt(storageKey)

    return !dismissedAt || Date.now() - dismissedAt > ttlDays * DAY_IN_MS
  })

  const dismiss = useCallback(() => {
    writeDismissedAt(storageKey, Date.now())
    setIsVisible(false)
  }, [storageKey])

  return { isVisible, dismiss }
}
