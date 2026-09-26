import { Github } from 'lucide-react'

import { AplicationLogo, LoginUsername, SwitchDatabase } from '@/components/shared'
import { ENABLE_REPO_LINK, GITHUB_REPOSITORIO_LINK } from '@/enviroment/enviroment'

/**
 * Navbar propio de la página principal (`/`).
 *
 * No lleva los links de navegación: el cuerpo de `HomePage` ya lleva a los tres destinos.
 * Tampoco lleva el toggle del sidebar, porque el landing no tiene sidebar.
 */
export function LandingNavbar() {
  return (
    <header id="navbar" className="w-full bg-transparent px-3 transition-all sm:px-4 md:px-5 lg:px-6 dark:shadow-none">
      <ul className="flex h-full flex-col items-center justify-between gap-3 py-2 sm:flex-row sm:flex-wrap">
        {/* La marca es el Home */}
        <AplicationLogo />

        {/* Base de datos activa: es global, afecta a todas las páginas */}
        <SwitchDatabase />

        <div className="flex flex-[1_1_0] flex-row items-center justify-end gap-2">
          {/* Usuario logueado (el tema vive dentro de sus opciones) */}
          <LoginUsername />

          {/* Link al repositorio */}
          {ENABLE_REPO_LINK && (
            <a
              href={GITHUB_REPOSITORIO_LINK}
              target="_blank"
              rel="noreferrer"
              aria-label="Repositorio en GitHub"
              className="hover:bg-action-hover text-secondary hover:text-primary grid place-content-center rounded-sm px-2 py-1.5 transition-colors"
            >
              <Github size={16} />
            </a>
          )}
        </div>
      </ul>
    </header>
  )
}
