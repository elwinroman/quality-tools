import { Search } from 'lucide-react'
import { useState } from 'react'
import { safeParse } from 'valibot'

import { Button, Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui'
import { AlertCircle as AlertCircleIcon } from '@/icons/alert-circle'

import { useLoginContext } from '../hooks/useLoginContext'
import { loginSchema } from '../schemas/login-schema'
import { Input, Label, PasswordInput } from './'

export function Form() {
  const { login, loading, error, databases, databasesLoading, databasesError, fetchDatabases } = useLoginContext()
  const [formErrors, setFormErrors] = useState<Record<string, string> | null>(null)
  const [selectedDb, setSelectedDb] = useState('')

  const onFetchDatabases = async (form: HTMLFormElement) => {
    const data = new FormData(form)

    const server = (data.get('server') as string)?.trim()
    const username = (data.get('username') as string)?.trim()
    const password = data.get('password') as string

    if (!server || !username || !password) {
      setFormErrors({
        ...(server ? {} : { server: 'El servidor es requerido' }),
        ...(username ? {} : { username: 'El usuario es requerido' }),
        ...(password ? {} : { password: 'La contraseña es requerida' }),
      })
      return
    }

    setFormErrors(null)
    setSelectedDb('')

    try {
      await fetchDatabases({ server, username, password })
    } catch {
      // el error se maneja en el hook via useFetchAndLoad
    }
  }

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormErrors(null)

    if (!selectedDb) {
      await onFetchDatabases(e.currentTarget)
      return
    }

    const data = new FormData(e.currentTarget)
    const rawData = { ...Object.fromEntries(data), dbname: selectedDb }

    const parsed = safeParse(loginSchema, rawData)

    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.issues) {
        if (issue.path && issue.path.length > 0) {
          const field = issue.path[0].key as string
          errors[field] = issue.message
        }
      }
      setFormErrors(errors)
      return
    }

    const credentials = parsed.output

    try {
      await login(credentials)
    } catch (err) {
      console.error('Error al intentar iniciar sesión: ', err)
    }
  }

  const hasDatabases = databases.length > 0

  const onSelectDatabase = (database: string | null) => {
    setSelectedDb(database ?? '')
  }

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-0.5">
          <Label text="Server" />
          <Input name="server" placeholder="Ingresa el nombre de tu servidor" defaultValue="10.5.81.141\pruebas" />
          {formErrors?.server && <p className="mt-0.5 text-xs text-red-500">{formErrors.server}</p>}
        </div>

        <div className="flex flex-col gap-0.5">
          <Label text="Usuario SQL" />
          <Input name="username" placeholder="Ingresa tu usuario SQL" />
          {formErrors?.username && <p className="mt-0.5 text-xs text-red-500">{formErrors.username}</p>}
        </div>

        <div className="flex flex-col gap-0.5">
          <Label text="Contraseña" />
          <PasswordInput name="password" />
          {formErrors?.password && <p className="mt-0.5 text-xs text-red-500">{formErrors.password}</p>}
        </div>

        <Button
          type="button"
          variant={databasesLoading ? 'disabled' : 'outline'}
          className="w-full"
          onClick={(e) => onFetchDatabases(e.currentTarget.closest('form')!)}
        >
          <Search className="mr-2 h-4 w-4" />
          {hasDatabases ? 'Actualizar bases de datos' : 'Buscar bases de datos'}
        </Button>

        <div className="flex flex-col gap-0.5">
          <Label text="Database" />
          <Combobox items={databases} value={selectedDb} onValueChange={onSelectDatabase}>
            <ComboboxInput
              disabled={!hasDatabases}
              placeholder={hasDatabases ? 'Selecciona una base de datos' : 'Primero busca las bases de datos'}
            />
            <ComboboxContent>
              <ComboboxEmpty>No se encontraron bases de datos</ComboboxEmpty>
              <ComboboxList>
                {(db: string) => (
                  <ComboboxItem key={db} value={db}>
                    {db}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {hasDatabases && (
            <p className="text-muted mt-0.5 text-xs">{databases.length} bases de datos encontradas. Selecciona una para iniciar sesión.</p>
          )}
          {formErrors?.dbname && <p className="mt-0.5 text-xs text-red-500">{formErrors.dbname}</p>}
        </div>
      </div>

      <div>
        <Button type="submit" className="w-full" variant={loading || !selectedDb ? 'disabled' : 'default'}>
          Iniciar sesión
        </Button>
      </div>

      {(error ?? databasesError) && (
        <div className="flex items-center gap-2 rounded-md bg-[#B71D18] px-4 py-2">
          <i className="pt-0.5 text-white">
            <AlertCircleIcon width={22} height={22} />
          </i>
          <p className="text-sm text-white">
            {error && hasDatabases ? `No tienes permisos para acceder a '${selectedDb}'.` : (error ?? databasesError)!.detail}
          </p>
        </div>
      )}
    </form>
  )
}
