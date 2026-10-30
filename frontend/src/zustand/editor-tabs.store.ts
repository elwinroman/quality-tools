import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

/**
 * Memoria del tab activo por página editora, persistida en `sessionStorage`.
 * Hay una slot por página (no por objeto): al volver desde otro menú se
 * restaura el tab sin importar qué objeto esté abierto.
 */
export interface EditorTabState {
  /** Tab recordado de la página Usertable, o `null` si aún no se usó. */
  usertableTab: string | null
  /** Tab recordado de la página SQLDefinition, o `null` si aún no se usó. */
  sqlDefinitionTab: string | null
  setUsertableTab(tab: string | null): void
  setSqlDefinitionTab(tab: string | null): void
}

export const useEditorTabsStore = create<EditorTabState>()(
  persist(
    (set) => ({
      usertableTab: null,
      sqlDefinitionTab: null,

      setUsertableTab: (tab) => set({ usertableTab: tab }),
      setSqlDefinitionTab: (tab) => set({ sqlDefinitionTab: tab }),
    }),
    {
      name: 'app.editor-tabs.session',
      storage: createJSONStorage(() => sessionStorage),
      // Sin partialize: JSON.stringify descarta las funciones (acciones) al serializar.
    },
  ),
)
