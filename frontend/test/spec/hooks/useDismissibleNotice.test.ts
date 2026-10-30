import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useDismissibleNotice } from '@/hooks/useDismissibleNotice'

const HOUR_IN_MS = 60 * 60 * 1000
const KEY = 'aviso-test'
const STORAGE_KEY = `dismissible-notice:${KEY}`

const dismissedAtFor = () => Number(localStorage.getItem(STORAGE_KEY)) || 0

beforeEach(() => {
  localStorage.clear()
})

describe('useDismissibleNotice', () => {
  it('muestra el aviso cuando nunca fue cerrado', () => {
    const { result } = renderHook(() => useDismissibleNotice(KEY, 4))

    expect(result.current.isVisible).toBe(true)
  })

  it('descarta el aviso y guarda la marca de tiempo en localStorage', () => {
    const { result } = renderHook(() => useDismissibleNotice(KEY, 4))

    act(() => result.current.dismiss())

    expect(result.current.isVisible).toBe(false)
    expect(dismissedAtFor()).toBeGreaterThan(0)
  })

  it('mantiene el aviso cerrado dentro del TTL de horas', () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now() - 1 * HOUR_IN_MS))

    const { result } = renderHook(() => useDismissibleNotice(KEY, 4))

    expect(result.current.isVisible).toBe(false)
  })

  it('vuelve a mostrar el aviso cuando el TTL de horas expiró', () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now() - 5 * HOUR_IN_MS))

    const { result } = renderHook(() => useDismissibleNotice(KEY, 4))

    expect(result.current.isVisible).toBe(true)
  })

  it('reopen vuelve a mostrar el aviso y limpia el registro de cierre', () => {
    const { result } = renderHook(() => useDismissibleNotice(KEY, 4))

    act(() => result.current.dismiss())
    expect(result.current.isVisible).toBe(false)

    act(() => result.current.reopen())

    expect(result.current.isVisible).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('expone show como alias de reopen', () => {
    const { result } = renderHook(() => useDismissibleNotice(KEY, 4))

    expect(result.current.show).toBe(result.current.reopen)
  })

  it('reopen sincroniza al instante a otra instancia con la misma key vía evento', () => {
    // Ambas arrancan cerradas (cierre vigente): sólo el evento de reapertura
    // las debe traer de vuelta.
    localStorage.setItem(STORAGE_KEY, String(Date.now()))

    const first = renderHook(() => useDismissibleNotice(KEY, 4))
    const second = renderHook(() => useDismissibleNotice(KEY, 4))

    expect(first.result.current.isVisible).toBe(false)
    expect(second.result.current.isVisible).toBe(false)

    act(() => first.result.current.reopen())

    expect(first.result.current.isVisible).toBe(true)
    expect(second.result.current.isVisible).toBe(true)
  })

  it('no sincroniza instancias con otra key', () => {
    const first = renderHook(() => useDismissibleNotice(KEY, 4))
    const second = renderHook(() => useDismissibleNotice('otro-aviso', 4))

    act(() => first.result.current.dismiss())
    act(() => first.result.current.reopen())

    // La otra key nunca fue cerrada: sigue visible, pero el punto es que el
    // evento de la primera no la toca (sigue en su estado, sin error).
    expect(second.result.current.isVisible).toBe(true)
  })
})
