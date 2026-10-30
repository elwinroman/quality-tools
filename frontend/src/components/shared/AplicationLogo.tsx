import { NavLink } from 'react-router-dom'

import { AppRoutes } from '@/constants'
import { APP_SHORT_NAME } from '@/enviroment/enviroment'

interface Props {
  className?: string
}

/**
 * Marca de la aplicación. Linkea al Home, así que oficia de "volver al inicio"
 * dentro del sidebar. No depende de la sesión: también se muestra deslogueado.
 */
export function AplicationLogo({ className = '' }: Props) {
  return (
    <div className={`${className}`}>
      <div className="flex w-fit items-center gap-4 transition-colors">
        <NavLink to={AppRoutes.Home} className="text-primary font-bold">
          {APP_SHORT_NAME}
        </NavLink>
      </div>
    </div>
  )
}
