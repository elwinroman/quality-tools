import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { usePersistentTab } from '@/hooks/usePersistentTab'
import { useEditorTabsStore } from '@/zustand'

const USERTABLE_DEFAULT = 'Structure'
const SQL_DEFAULT = 'Script'

// El store vive en memoria entre tests: se limpia su slot para que no se filtren
beforeEach(() => {
  useEditorTabsStore.setState({ usertableTab: null, sqlDefinitionTab: null })
})

describe('usePersistentTab', () => {
  it('restaura el tab recordado al remontar con el mismo qualifiedName', () => {
    const { result, unmount } = renderHook(() => usePersistentTab('usertable', 'dbo.Clientes', USERTABLE_DEFAULT, true))

    expect(result.current[0]).toBe(USERTABLE_DEFAULT)

    act(() => result.current[1]('Indexes'))
    expect(result.current[0]).toBe('Indexes')

    unmount()

    // Simula el viaje de ida y vuelta al menú: mismo qualifiedName, slot intacta
    const { result: remounted } = renderHook(() => usePersistentTab('usertable', 'dbo.Clientes', USERTABLE_DEFAULT, true))

    expect(remounted.current[0]).toBe('Indexes')
  })

  it('resetea el slot al default cuando cambia el qualifiedName', () => {
    const { result, rerender } = renderHook(({ qualifiedName }) => usePersistentTab('usertable', qualifiedName, USERTABLE_DEFAULT, true), {
      initialProps: { qualifiedName: 'dbo.Clientes' },
    })

    act(() => result.current[1]('Indexes'))
    expect(result.current[0]).toBe('Indexes')

    rerender({ qualifiedName: 'dbo.Pedidos' })

    expect(result.current[0]).toBe(USERTABLE_DEFAULT)
    expect(useEditorTabsStore.getState().usertableTab).toBe(USERTABLE_DEFAULT)
  })

  it('cae al default cuando el tab recordado no está disponible', () => {
    useEditorTabsStore.setState({ usertableTab: 'Indexes' })

    const { result } = renderHook(() => usePersistentTab('usertable', 'dbo.Clientes', USERTABLE_DEFAULT, false))

    expect(result.current[0]).toBe(USERTABLE_DEFAULT)
  })

  it('resetea al default cuando la ruta queda sin objeto (qualifiedName undefined)', () => {
    const { result, rerender } = renderHook(
      ({ qualifiedName }: { qualifiedName: string | undefined }) => usePersistentTab('usertable', qualifiedName, USERTABLE_DEFAULT, true),
      { initialProps: { qualifiedName: 'dbo.Clientes' as string | undefined } },
    )

    act(() => result.current[1]('Indexes'))
    expect(result.current[0]).toBe('Indexes')

    // Ruta sin objeto: /usertable a secas, el slot debe limpiarse
    rerender({ qualifiedName: undefined })

    expect(result.current[0]).toBe(USERTABLE_DEFAULT)
    expect(useEditorTabsStore.getState().usertableTab).toBe(USERTABLE_DEFAULT)
  })

  it('arranca en el default con el store vacío, sin resetear en el mount', () => {
    const { result } = renderHook(() => usePersistentTab('usertable', 'dbo.Clientes', USERTABLE_DEFAULT, true))

    // El valor correcto está en el primer render: no hay effect que sincronice
    expect(result.current[0]).toBe(USERTABLE_DEFAULT)
    expect(useEditorTabsStore.getState().usertableTab).toBeNull()
  })

  it('lee el slot ya en el primer render cuando hay tab recordado', () => {
    useEditorTabsStore.setState({ usertableTab: 'Indexes' })

    const { result } = renderHook(() => usePersistentTab('usertable', 'dbo.Clientes', USERTABLE_DEFAULT, true))

    expect(result.current[0]).toBe('Indexes')
  })

  it('acepta updater en el setter y usa la slot de su scope', () => {
    const { result } = renderHook(() => usePersistentTab('sqldefinition', 'dbo.Vista', SQL_DEFAULT, true))

    act(() => result.current[1]('Compare'))
    expect(result.current[0]).toBe('Compare')

    act(() => result.current[1]((currentTab) => (currentTab === 'Compare' ? SQL_DEFAULT : currentTab)))

    expect(result.current[0]).toBe(SQL_DEFAULT)
    expect(useEditorTabsStore.getState().sqlDefinitionTab).toBe(SQL_DEFAULT)
    expect(useEditorTabsStore.getState().usertableTab).toBeNull()
  })
})
