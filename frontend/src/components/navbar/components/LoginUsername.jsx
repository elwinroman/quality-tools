import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { User as UserIcon } from '@/icons/user'
import { useAuthStore } from '@/stores/auth.store'
import { useSQLDefinitionStore } from '@/stores/sqldefinition.store'
import { useUserTableStore } from '@/stores/usertable.store'

export function LoginUsername() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const logoutUser = useAuthStore((state) => state.logoutUser)
  const username = useAuthStore((state) => state.username)
  const resetSQLDefinitionStore = useSQLDefinitionStore((state) => state.reset)
  const resetUserTableStore = useUserTableStore((state) => state.reset)

  const closeSession = async (e) => {
    await logoutUser()
    await resetSQLDefinitionStore()
    await resetUserTableStore()
    await useSQLDefinitionStore.persist.clearStorage()
    await useUserTableStore.persist.clearStorage()
  }

  return (
    <li>
      {!isAuthenticated ? (
        <Button variant="ghost" size="sm">
          <div className="flex items-center gap-1">
            <i>
              <UserIcon width={20} height={20} />
            </i>
            <span className="select-none text-sm font-semibold">
              Iniciar sesión
            </span>
          </div>
        </Button>
      ) : (
        <div className="grid h-9 place-content-center px-3">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>QA</AvatarFallback>
                </Avatar>
                <span className="select-none text-sm font-semibold">
                  {username}
                </span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" sideOffset={10}>
              <DropdownMenuLabel>Mi cuenta SQL</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <button onClick={closeSession}>Cerrar sesión</button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </li>
  )
}
