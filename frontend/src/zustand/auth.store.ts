import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'

import { AuthContext } from '@/models'
import { BearAuthState } from '@/models/zustand'

const initialState: Pick<BearAuthState, 'authContext' | 'token' | 'errorApiConnection'> = {
  authContext: null,
  token: null,
  errorApiConnection: false,
}

export const useAuthStore = create<BearAuthState>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        createSession: (payload: AuthContext, token: string): void => {
          set({
            authContext: payload,
            token: token,
          })
        },

        clearSession: (): void => set({ ...initialState }),
        updateToken: (token: string): void => set({ token: token }),
        updateErrorApiConnection: (state: boolean): void => set({ errorApiConnection: state }),
        updateDatabase: (database: string): void =>
          set((state) => ({
            authContext: state.authContext ? { ...state.authContext, database } : null,
          })),
      }),
      {
        name: 'app.auth.local',
        storage: createJSONStorage(() => localStorage),
        // `database` lo posee el servidor (`check-session`): no se persiste para no mostrar una copia obsoleta
        // cuando la sesión cambia de base de datos en otra pestaña. Se restablece desde el servidor.
        partialize: (state) => ({
          token: state.token,
          authContext: state.authContext ? { ...state.authContext, database: '' } : null,
        }),
      },
    ),
  ),
)

// authStore selector
export const getAccessToken = () => useAuthStore.getState().token
export const setAccessToken = (token: string) => {
  useAuthStore.getState().updateToken(token)
}
export const getClearSession = () => useAuthStore.getState().clearSession()
