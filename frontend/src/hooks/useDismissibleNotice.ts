import { useCallback, useEffect, useState } from 'react'

const HOUR_IN_MS = 60 * 60 * 1000

/**
 * Prefijo del evento de navegador que sincroniza instancias del hook con la misma
 * key: quien reabre el aviso dispara `reabrir`, y las demás instancias escuchan
 * `<prefijo>:<key>` para volver a mostrarse al instante (mismo tab).
 */
const REOPEN_EVENT_PREFIX = 'dismissible-notice:reopen'

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

function clearDismissedAt(storageKey: string): void {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // Sin almacenamiento, el aviso ya vive sólo en memoria: no hay nada que limpiar.
  }
}

/**
 * Recuerda si un aviso fue cerrado para no volver a mostrarlo por un tiempo.
 *
 * Guarda la marca de tiempo en localStorage y lo vuelve a mostrar pasado el TTL, así
 * reaparece cada tanto en vez de en cada refresco.
 *
 * Además expone `reopen` (alias `show`) para reabrirlo a mano: limpia el cierre
 * guardado, lo muestra y avisa por un evento de navegador al resto de las instancias
 * con la misma key, para que todas reaccionen en el mismo render. SSR-safe: el acceso
 * a `window` queda bajo try/catch y los efectos sólo corren en cliente.
 */
export function useDismissibleNotice(key: string, ttlHours = 4) {
  const storageKey = `dismissible-notice:${key}`
  const reopenEvent = `${REOPEN_EVENT_PREFIX}:${key}`

  const [isVisible, setIsVisible] = useState(() => {
    const dismissedAt = readDismissedAt(storageKey)

    return !dismissedAt || Date.now() - dismissedAt > ttlHours * HOUR_IN_MS
  })

  // Otras instancias (o botones externos) pueden pedir la reapertura: escuchamos su
  // evento key-scoped y nos mostramos. La instancia que disparó ya se mostró sola.
  useEffect(() => {
    const handleReopen = () => setIsVisible(true)

    window.addEventListener(reopenEvent, handleReopen)

    return () => window.removeEventListener(reopenEvent, handleReopen)
  }, [reopenEvent])

  const dismiss = useCallback(() => {
    writeDismissedAt(storageKey, Date.now())
    setIsVisible(false)
  }, [storageKey])

  const reopen = useCallback(() => {
    clearDismissedAt(storageKey)
    setIsVisible(true)
    window.dispatchEvent(new CustomEvent(reopenEvent))
  }, [reopenEvent, storageKey])

  return { isVisible, dismiss, reopen, show: reopen }
}
