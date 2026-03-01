import { useLocation } from 'react-router-dom'

import { ENABLE_NAVBAR_REPO_LINK } from '@/enviroment/enviroment'

import { AplicationLogo, GithubRepo, LoginUsername, NavbarMenu, ThemeToggle } from './components'

interface Props {
  className?: string
}

export function Navbar({ className = '' }: Props) {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'

  return (
    <header
      id="navbar"
      className={`w-full px-3 transition-all sm:px-4 md:px-5 lg:px-6 dark:shadow-none ${className} ${isLanding ? 'bg-transparent' : 'bg-action-hover'}`}
    >
      <ul className="flex h-full flex-col items-center justify-between gap-3 py-2 sm:flex-row sm:flex-wrap">
        {/* Aplication logo */}
        <AplicationLogo className="flex-[1_1_0]" />

        {/* Menu de navegación */}
        <NavbarMenu className="w-full sm:w-auto" />

        <div className="flex flex-[1_1_0] flex-row items-center justify-end gap-2">
          {/* Usuario logueado o inicio de sesión */}
          <LoginUsername />

          {/* Theme toggle (dark/light) */}
          <ThemeToggle />

          {/* Repo link */}
          {ENABLE_NAVBAR_REPO_LINK && <GithubRepo />}
        </div>
      </ul>
    </header>
  )
}
