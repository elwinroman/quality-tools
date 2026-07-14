import { useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { AppRoutes } from '@/constants'
import { useSysObjectStore } from '@/pages/SQLDefinition/store/sysobject.store'
import { useUserTableStore } from '@/pages/Usertable/store/usertable.store'
import { buildQualifiedSysObjectPath } from '@/utilities/sysobject-route.util'

interface Props {
  className?: string
}

export function NavbarMenu({ className }: Props) {
  const currentLocation = useLocation()
  const sysobject = useSysObjectStore((state) => state.sysobject)
  const userTableObject = useUserTableStore((state) => state.userTableObject)

  const menuBackdrop = useRef<HTMLDivElement>(null)

  const menuList = [
    {
      id: 1,
      title: 'Definición SQL',
      href: sysobject
        ? buildQualifiedSysObjectPath(AppRoutes.SQL_DEFINITION, sysobject.schemaName, sysobject.name)
        : AppRoutes.SQL_DEFINITION,
      activePath: AppRoutes.SQL_DEFINITION,
    },
    {
      id: 2,
      title: 'Tabla de usuario',
      href: userTableObject
        ? buildQualifiedSysObjectPath(AppRoutes.USERTABLE, userTableObject.schemaName, userTableObject.name)
        : AppRoutes.USERTABLE,
      activePath: AppRoutes.USERTABLE,
    },
    {
      id: 3,
      title: 'Aligment',
      href: AppRoutes.Aligment,
      activePath: AppRoutes.Aligment,
    },
  ]

  const isActiveMenu = (activePath: string) => {
    return currentLocation.pathname === activePath || currentLocation.pathname.startsWith(`${activePath}/`)
  }

  /**
   * Ajusta la posición y el tamaño del fondo dinámico en función de la posición del elemento sobre el que se hace hover.
   * @param {Object} e - El evento del mouse para obtener el elemento actual.
   */
  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const { top, left, width, height } = e.currentTarget.getBoundingClientRect()

    if (!menuBackdrop.current) return null

    menuBackdrop.current.style.setProperty('--left', `${left}px`)
    menuBackdrop.current.style.setProperty('--top', `${top}px`)
    menuBackdrop.current.style.setProperty('--width', `${width}px`)
    menuBackdrop.current.style.setProperty('--height', `${height}px`)

    menuBackdrop.current.style.opacity = '1'
    menuBackdrop.current.style.visibility = 'visible'
  }

  /**
   * Oculta el fondo dinámico cuando el mouse deja el área del elemento del menú.
   */
  const handleMouseLeave = () => {
    if (!menuBackdrop.current) return null

    menuBackdrop.current.style.opacity = '0'
    menuBackdrop.current.style.visibility = 'hidden'
  }

  return (
    <div className={`${className}`}>
      <ul
        className="flex flex-nowrap justify-between overflow-x-auto sm:justify-center"
        style={{ scrollbarColor: 'transparent', scrollBehavior: 'smooth' }}
      >
        {menuList.map((menu) => (
          <li key={menu.id}>
            <NavLink
              className="group relative z-10 inline-block rounded-sm px-4 py-1.5 transition-colors before:absolute before:top-[40px] before:left-0 before:w-full before:content-['']"
              to={menu.href}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <span
                className={`text-sm font-semibold text-nowrap transition-colors ${isActiveMenu(menu.activePath) ? 'text-primary/90' : 'text-primary/50 group-hover:text-primary/90'} `}
              >
                {menu.title}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/*  Hover menú dinámico (Similar a vercel) */}
      <div
        ref={menuBackdrop}
        className={`bg-action-hover pointer-events-none fixed top-0 left-0 h-[var(--height)] w-[var(--width)] translate-x-[var(--left)] translate-y-[var(--top)] rounded-sm opacity-0 backdrop-blur-lg transition-all duration-200 ease-in-out`}
      ></div>
    </div>
  )
}
