import { useCallback, useEffect, useRef } from 'react'

import { useEditorTabsStore } from '@/zustand'

/** Página editora dueña del slot: cada página tiene su propia memoria de tab. */
export type EditorTabScope = 'usertable' | 'sqldefinition'

/** Setter que acepta valor directo u updater, compatible con `onValueChange` de Radix. */
export type PersistentTabSetter = (tab: string | ((currentTab: string) => string)) => void

/**
 * Memoria del tab activo por página: lee y escribe el slot de `useEditorTabsStore`,
 * resetea el slot al cambiar de objeto y evita restaurar un tab deshabilitado
 * (Radix no puede activar un trigger disabled).
 *
 * @param scope - Slot a usar: la de Usertable o la de SQLDefinition.
 * @param qualifiedName - Objeto de la ruta (`undefined` en rutas sin objeto).
 * @param defaultTab - Tab por defecto de la página.
 * @param isTabAvailable - `true` cuando los tabs que requieren objeto pueden
 *   mostrarse; el tab default nunca se deshabilita, por eso no necesita guardia.
 * @returns `[activeTab, setActiveTab]`. `activeTab` se deriva del slot en cada
 *   render: es correcto ya en el primer render, sin flash del default.
 */
export function usePersistentTab(
  scope: EditorTabScope,
  qualifiedName: string | undefined,
  defaultTab: string,
  isTabAvailable: boolean,
): [string, PersistentTabSetter] {
  const rememberedTab = useEditorTabsStore((state) => (scope === 'usertable' ? state.usertableTab : state.sqlDefinitionTab))
  const setSlot = useEditorTabsStore((state) => (scope === 'usertable' ? state.setUsertableTab : state.setSqlDefinitionTab))

  // Reset al cambiar de objeto: el ref arranca con el valor actual para que
  // en el mount solo se lea el slot y no se dispare el reset.
  const previousQualifiedName = useRef(qualifiedName)

  useEffect(() => {
    if (previousQualifiedName.current === qualifiedName) return
    previousQualifiedName.current = qualifiedName
    setSlot(defaultTab)
  }, [defaultTab, qualifiedName, setSlot])

  // Derivado en render (no sincronizado por effect): el tab recordado solo se
  // usa si está disponible; si no, se cae al default de la página.
  const activeTab = rememberedTab !== null && (rememberedTab === defaultTab || isTabAvailable) ? rememberedTab : defaultTab

  // El updater recibe el tab vigente del render más reciente: los effects que
  // lo usan corren después del commit, con los valores frescos.
  const setActiveTab = useCallback<PersistentTabSetter>(
    (tab) => {
      const nextTab = typeof tab === 'function' ? tab(activeTab) : tab
      setSlot(nextTab)
    },
    [activeTab, setSlot],
  )

  return [activeTab, setActiveTab]
}
