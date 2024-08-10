import { checkSession, login, logout } from '@/services/auth.service'
import { create } from 'zustand'
import { JSONtoTextCode } from '@/utilities'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      isSessionExpired: false,
      username: null,
      database: null,
      errorAuth: null,

      /**
       * Login user
       * @param {Object} credentials - Credenciales sql del usuario (server, database, user, password)
       */
      loginUser: async ({ credentials }) => {
        const res = await login({ credentials })

        if (res.error) {
          set({ errorAuth: JSONtoTextCode({ json: res }) })
          set({ isAuthenticated: false })
          set({ username: null })
          set({ database: null })
          return
        }

        set({ isAuthenticated: true })
        set({ username: credentials.username })
        set({ database: credentials.database })
        set({ errorAuth: null })
      },

      // Logout user
      logoutUser: async () => {
        await logout()
        set({ isAuthenticated: false })
        set({ username: null })
        set({ database: null })
        set({ errorAuth: null })
      },

      // Comprueba la conexión del usuario (cookie expired)
      checkSession: async () => {
        const res = await checkSession()
        // Unauthorized
        if (res.error) set({ isSessionExpired: true })
      },

      // Clear auth store
      clearAuthStore: () => {
        set({ isAuthenticated: false })
        set({ username: null })
        set({ database: null })
        set({ errorAuth: null })
        set({ isSessionExpired: false })
      },
    }),
    {
      name: 'is-authenticated', // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    },
  ),
)
