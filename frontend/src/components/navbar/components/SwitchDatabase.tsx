import { useState } from 'react'
import { toast } from 'sonner'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
import useFetchAndLoad from '@/hooks/useFetchAndLoad'
import { useSysObjectStore } from '@/pages/SQLDefinition/store/sysobject.store'
import { useUserTableStore } from '@/pages/Usertable/store/usertable.store'
import { listDatabasesAuthenticatedService, switchDatabaseService } from '@/services'
import { useAuthStore } from '@/zustand'

export function SwitchDatabase() {
  const authContext = useAuthStore((state) => state.authContext)
  const updateDatabase = useAuthStore((state) => state.updateDatabase)
  const clearSysObject = useSysObjectStore((state) => state.createSysObject)
  const resetUserTable = useUserTableStore((state) => state.reset)

  const { callEndpoint: callListDatabases, loading: loadingDatabases } = useFetchAndLoad<string[]>()
  const { callEndpoint: callSwitchDatabase } = useFetchAndLoad()

  const [databases, setDatabases] = useState<string[]>([])

  if (!authContext) return null

  const handleOpenChange = async (isOpen: boolean) => {
    if (!isOpen) {
      setDatabases([])
      return
    }

    try {
      const response = await callListDatabases(listDatabasesAuthenticatedService())
      setDatabases(response.data.filter((db) => db !== authContext.database))
    } catch {
      toast.error('Error', { description: 'No se pudieron obtener las bases de datos disponibles.' })
    }
  }

  const handleValueChange = async (db: string) => {
    try {
      await callSwitchDatabase(switchDatabaseService(db))
      updateDatabase(db)
      clearSysObject(null)
      resetUserTable()
      toast.success('Success', { description: `Base de datos cambiada. Conectado a '${db}'.` })
    } catch {
      toast.error('Error', { description: `Acceso denegado. No tienes permisos para acceder a '${db}'.` })
    }
  }

  return (
    <Select value={authContext.database} onOpenChange={handleOpenChange} onValueChange={handleValueChange}>
      <SelectTrigger className="text-secondary hover:bg-action-hover hover:text-primary h-auto w-auto gap-1.5 rounded-sm border-none bg-transparent px-3 py-1.5 text-sm shadow-none transition-colors focus:ring-0">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {/* BD actual (siempre presente para que SelectValue la muestre) */}
        <SelectItem value={authContext.database} disabled>
          {authContext.database}
        </SelectItem>

        {loadingDatabases ? (
          <SelectItem value="_loading" disabled>
            Cargando...
          </SelectItem>
        ) : (
          databases.map((db) => (
            <SelectItem key={db} value={db}>
              {db}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
