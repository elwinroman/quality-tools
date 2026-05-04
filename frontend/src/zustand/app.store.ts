import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { BearAppState } from '@/models/zustand'

const initialState: Pick<BearAppState, 'isDark' | 'switchingDatabase'> = {
  isDark: true,
  switchingDatabase: null,
}

export const useAppStore = create<BearAppState>()(
  persist(
    (set) => ({
      ...initialState,

      updateDark: (state) => {
        const html = document.documentElement

        if (state) html.classList.add('dark')
        else html.classList.remove('dark')

        set({ isDark: state })
      },

      updateSwitchingDatabase: (database) => {
        set({ switchingDatabase: database })
      },
    }),
    {
      name: 'app.global.settings',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ isDark: state.isDark }) as BearAppState,

      // ejecuta cuando el estado se rehidrata desde localStorage (agrega la clase 'dark' si es necesario)
      onRehydrateStorage: () => (state) => {
        const html = document.documentElement
        if (state?.isDark) html.classList.add('dark')
        else html.classList.remove('dark')
      },
    },
  ),
)
