import { User } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { LoginUsername, ThemeToggle } from '@/components/shared'
import { AppRoutes } from '@/constants'
import { useAuthStore } from '@/zustand'

interface Props {
  /**
   * Acción extra junto al bloque de perfil (p. ej. reabrir el aviso de Aligment).
   * Se renderiza con o sin sesión: a la izquierda queda el perfil o el acceso al
   * login y a la derecha esta acción junto al switch de tema.
   */
  footerAction?: ReactNode
}

/**
 * Fila inferior del sidebar: el perfil del usuario cuando hay sesión, o el acceso
 * al login cuando no la hay. A la derecha agrupa la acción opcional (`footerAction`)
 * junto al switch de tema, que vive acá para estar disponible en ambos estados.
 *
 * Resuelve la sesión por su cuenta porque eso es asunto suyo: es el bloque de perfil.
 */
export function SidebarFooter({ footerAction }: Props) {
  const navigate = useNavigate()
  const authContext = useAuthStore((state) => state.authContext)

  return (
    <footer className="flex shrink-0 items-center justify-between gap-2 px-4 py-2">
      {authContext ? (
        <LoginUsername />
      ) : (
        <button
          type="button"
          className="hover:bg-action-hover flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors"
          onClick={() => navigate(AppRoutes.Login)}
        >
          <User size={16} />
          <span>Iniciar sesión</span>
        </button>
      )}

      <div className="flex items-center gap-2">
        {footerAction}
        <ThemeToggle />
      </div>
    </footer>
  )
}
