import { Check, ChevronsUpDown, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { CircleLoader } from '@/components/loader'
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui'
import useFetchAndLoad from '@/hooks/useFetchAndLoad'
import { cn } from '@/lib/utils'
import { useSysObjectStore } from '@/pages/SQLDefinition/store/sysobject.store'
import { useUserTableStore } from '@/pages/Usertable/store/usertable.store'
import { listDatabasesAuthenticatedService, switchDatabaseService } from '@/services'
import { useAppStore, useAuthStore } from '@/zustand'

export function SwitchDatabase() {
  const authContext = useAuthStore((state) => state.authContext)
  const updateDatabase = useAuthStore((state) => state.updateDatabase)
  const switchingDatabase = useAppStore((state) => state.switchingDatabase)
  const updateSwitchingDatabase = useAppStore((state) => state.updateSwitchingDatabase)
  const clearSysObject = useSysObjectStore((state) => state.createSysObject)
  const resetUserTable = useUserTableStore((state) => state.reset)

  const { callEndpoint: callListDatabases, loading: loadingDatabases } = useFetchAndLoad<string[]>()
  const { callEndpoint: callSwitchDatabase } = useFetchAndLoad()

  const [databases, setDatabases] = useState<string[]>([])
  const [open, setOpen] = useState(false)

  if (!authContext) return null

  const fetchDatabases = async (force = false) => {
    if (switchingDatabase || (!force && (databases.length > 0 || loadingDatabases))) return

    try {
      const response = await callListDatabases(listDatabasesAuthenticatedService())
      setDatabases(response.data)
    } catch {
      toast.error('Error', { description: 'No se pudieron obtener las bases de datos disponibles.' })
    }
  }

  const handleValueChange = async (db: string | null) => {
    if (!db || db === authContext.database || switchingDatabase) return

    updateSwitchingDatabase(db)
    setOpen(false)
    try {
      await callSwitchDatabase(switchDatabaseService(db))
      updateDatabase(db)
      clearSysObject(null)
      resetUserTable()
      toast.success('Success', { description: `Base de datos cambiada. Conectado a '${db}'.` })
    } catch {
      toast.error('Error', { description: `Acceso denegado. No tienes permisos para acceder a '${db}'.` })
    } finally {
      updateSwitchingDatabase(null)
    }
  }

  const availableDatabases = databases.length > 0 ? databases : [authContext.database]

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (switchingDatabase) return
        setOpen(nextOpen)
        if (nextOpen) void fetchDatabases()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={Boolean(switchingDatabase)}
          className={cn(
            'text-secondary hover:bg-action-hover/80 hover:text-primary focus:bg-action-hover/80 h-8 max-w-[240px] justify-start gap-1.5 rounded-sm bg-transparent px-2 py-1 text-sm font-normal shadow-none disabled:cursor-wait disabled:opacity-100',
            switchingDatabase && 'bg-action-hover/80 text-primary',
          )}
        >
          <span className="min-w-0 truncate text-left">{authContext.database}</span>
          {switchingDatabase ? (
            <span className="relative h-3.5 w-3.5 shrink-0" aria-label="Cambiando base de datos">
              <CircleLoader visible size={14} color="currentColor" />
            </span>
          ) : (
            <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="mix-colored-background bg-background-paperchanel w-[clamp(180px,20vw,260px)] overflow-hidden border-none p-0 shadow-xl shadow-black/20 ring-1 ring-white/5"
      >
        <Command>
          <CommandInput placeholder={loadingDatabases ? 'Cargando bases...' : 'Buscar base de datos...'} />
          <CommandList>
            <CommandEmpty>{loadingDatabases ? 'Cargando...' : 'No se encontraron bases de datos'}</CommandEmpty>
            <CommandGroup heading="Base de datos actual">
              <CommandItem value={authContext.database} className="text-xs" disabled>
                <Check className="text-primary h-4 w-4" />
                <span className="truncate">{authContext.database}</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Cambiar a">
              {availableDatabases
                .filter((db) => db !== authContext.database)
                .map((db) => (
                  <CommandItem
                    className={cn('cursor-pointer', switchingDatabase && 'pointer-events-none opacity-70')}
                    key={db}
                    value={db}
                    onSelect={() => handleValueChange(db)}
                    disabled={Boolean(switchingDatabase)}
                  >
                    {switchingDatabase === db ? (
                      <span className="relative h-4 w-4 shrink-0 text-primary" aria-label="Cambiando base de datos">
                        <CircleLoader visible size={14} color="currentColor" />
                      </span>
                    ) : (
                      <Check className={cn('h-4 w-4 opacity-0', db === authContext.database && 'opacity-100')} />
                    )}
                    <span className="truncate text-xs">{db}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                className="cursor-pointer"
                value="actualizar bases de datos"
                onSelect={() => fetchDatabases(true)}
                disabled={loadingDatabases || Boolean(switchingDatabase)}
              >
                <RefreshCw className={cn('h-3 w-3', loadingDatabases && 'animate-spin')} />
                <span className="text-xs">Actualizar listado</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
