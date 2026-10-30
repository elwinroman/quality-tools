import { FileCode2, GitCompareArrows, TableProperties } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

import { AppRoutes } from '@/constants'
import { cn } from '@/lib/utils'
import { useSysObjectStore } from '@/pages/SQLDefinition/store/sysobject.store'
import { useUserTableStore } from '@/pages/Usertable/store/usertable.store'
import { buildQualifiedSysObjectPath } from '@/utilities/sysobject-route.util'

interface Props {
  className?: string
  onNavigate?: () => void
}

export function SidebarNav({ className, onNavigate }: Props) {
  const currentLocation = useLocation()
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const userTableObject = useUserTableStore((state) => state.userTableObject)

  const menuList = [
    {
      id: 1,
      title: 'Definición SQL',
      icon: FileCode2,
      href: sysobject
        ? buildQualifiedSysObjectPath(AppRoutes.SQL_DEFINITION, sysobject.schemaName, sysobject.name)
        : AppRoutes.SQL_DEFINITION,
      activePath: AppRoutes.SQL_DEFINITION,
    },
    {
      id: 2,
      title: 'Tabla de usuario',
      icon: TableProperties,
      href: userTableObject
        ? buildQualifiedSysObjectPath(AppRoutes.USERTABLE, userTableObject.schemaName, userTableObject.name)
        : AppRoutes.USERTABLE,
      activePath: AppRoutes.USERTABLE,
    },
    {
      id: 3,
      title: 'Aligment',
      icon: GitCompareArrows,
      href: AppRoutes.Aligment,
      activePath: AppRoutes.Aligment,
    },
  ]

  const isActiveMenu = (activePath: string) => {
    return currentLocation.pathname === activePath || currentLocation.pathname.startsWith(`${activePath}/`)
  }

  return (
    <nav className={className}>
      <ul className="flex flex-col gap-0.5">
        {menuList.map((menu) => {
          const isActive = isActiveMenu(menu.activePath)
          const Icon = menu.icon

          return (
            <li key={menu.id}>
              {/* Hover y activo siguen el mismo criterio que los ítems de Favoritos */}
              <NavLink
                className={cn(
                  'group/nav hover:bg-action-hover flex w-full items-center gap-2 rounded-sm px-2 py-2 text-sm text-nowrap',
                  isActive && 'bg-action-hover',
                )}
                to={menu.href}
                onClick={() => onNavigate?.()}
              >
                <Icon size={14} className={cn('shrink-0', isActive ? 'text-primary' : 'text-secondary group-hover/nav:text-primary')} />
                <span className={cn('min-w-0 truncate', isActive ? 'text-primary' : 'text-primary/60 group-hover/nav:text-primary')}>
                  {menu.title}
                </span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
