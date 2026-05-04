import { NavLink } from 'react-router-dom'

import { AppRoutes } from '@/constants'
import { APP_SHORT_NAME } from '@/enviroment/enviroment'
import { useAuthStore } from '@/zustand'

import { SwitchDatabase } from './SwitchDatabase'

interface Props {
  className?: string
}

export function AplicationLogo({ className = '' }: Props) {
  const authContext = useAuthStore((state) => state.authContext)

  if (!authContext) throw new Error('Error al obtener informcación de login: ')

  return (
    <div className={`${className}`}>
      <div className="flex w-fit items-center gap-4 transition-colors">
        <NavLink to={AppRoutes.Home} className="text-primary font-bold">
          {APP_SHORT_NAME}
        </NavLink>

        <SwitchDatabase />
      </div>
    </div>
  )
}
