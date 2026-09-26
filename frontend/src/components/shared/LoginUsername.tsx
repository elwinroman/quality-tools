import { User } from 'lucide-react'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui'
import useFetchAndLoad from '@/hooks/useFetchAndLoad'
import { cn } from '@/lib/utils'
import { useSysObjectStore } from '@/pages/SQLDefinition/store/sysobject.store'
import { useUserTableStore } from '@/pages/Usertable/store/usertable.store'
import { logoutService } from '@/services'
import { useAuthStore } from '@/zustand'

import { ThemeToggle } from './ThemeToggle'

interface Props {
  className?: string
}

/**
 * Perfil del usuario: avatar, nombre y las opciones de cuenta (tema, repositorio y cierre de sesión).
 *
 * No envuelve en `<li>` ni fija tamaños: cada consumidor decide cómo posicionarlo
 * (navbar, footer del sidebar, footer de Aligment).
 */
export function LoginUsername({ className = '' }: Props) {
  const clearSession = useAuthStore((state) => state.clearSession)
  const authContext = useAuthStore((state) => state.authContext)
  const resetSysObject = useSysObjectStore((state) => state.reset)
  const resetUserTable = useUserTableStore((state) => state.reset)
  const { callEndpoint } = useFetchAndLoad()

  if (!authContext) return

  const closeSession = async () => {
    try {
      await callEndpoint(logoutService())

      clearSession()
      resetSysObject()
      resetUserTable()
      useAuthStore.persist.clearStorage()
      useSysObjectStore.persist.clearStorage()
      useUserTableStore.persist.clearStorage()
    } catch (err) {
      console.error('Error al intentar cerrar sesion: ', err)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn('group hover:bg-action-hover flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5', className)}
      >
        <Avatar>
          <AvatarImage src="/shadcn-profile-morty.jpg" />
          <AvatarFallback>QA</AvatarFallback>
        </Avatar>
        <span className="text-secondary group-hover:text-primary text-sm font-medium transition-colors select-none">
          {authContext.username}
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="center" sideOffset={10} collisionPadding={16} className="w-56">
        <DropdownMenuLabel>Mi cuenta SQL</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Tema: conserva el switch original para no agrandar la card */}
        <DropdownMenuItem className="justify-between gap-2" onSelect={(event) => event.preventDefault()}>
          <span>Tema</span>
          <ThemeToggle />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <button type="button" onClick={closeSession} className="w-full justify-between gap-2">
            <span>Cerrar sesión</span>
            <User size={14} />
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
