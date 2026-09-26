import { User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { LoginUsername, ThemeToggle } from '@/components/shared'
import { AppRoutes } from '@/constants'
import { useAuthStore } from '@/zustand'

/**
 * Fila inferior del sidebar: el perfil del usuario cuando hay sesión, o el acceso
 * al login junto al switch de tema cuando no la hay.
 *
 * Resuelve la sesión por su cuenta porque eso es asunto suyo: es el bloque de perfil.
 */
export function SidebarFooter() {
  const navigate = useNavigate()
  const authContext = useAuthStore((state) => state.authContext)

  return (
    <footer className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
      {authContext ? (
        <LoginUsername />
      ) : (
        <>
          <button
            type="button"
            className="hover:bg-action-hover flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors"
            onClick={() => navigate(AppRoutes.Login)}
          >
            <User size={16} />
            <span>Iniciar sesión</span>
          </button>

          <ThemeToggle />
        </>
      )}
    </footer>
  )
}
