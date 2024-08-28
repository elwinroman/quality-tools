import { Configuration } from './components/Configuration'
import { HamburguerMenu } from './components/HamburguerMenu'
import { LoginUsername } from './components/LoginUsername'
import { SearchInput } from './components/SearchInput'
import { NavMenu } from './components/NavMenu'

export function Navbar() {
  return (
    <header className="w-full flex-[0_0_var(--navbar-height)]">
      <ul className="flex h-full flex-row items-center gap-4 px-4">
        {/* Hamburguer menu */}
        <HamburguerMenu />

        {/* White space (ocupa el maximo espacio) */}
        <NavMenu className="flex-grow" />

        {/* Input de búsqueda */}
        <SearchInput />

        {/* Usuario logueado o inicio de sesión */}
        <LoginUsername />

        {/* Icono configuración */}
        <Configuration />
      </ul>
    </header>
  )
}
