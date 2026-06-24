import { Link, Navigate } from 'react-router-dom'

import { SpinnerBotLoader } from '@/components/loader'
import { useAuthStore } from '@/zustand'

import { Form, SideBox } from './components'
import { useLoginContext } from './hooks/useLoginContext'

export function LoginPage() {
  const authContext = useAuthStore((state) => state.authContext)
  const { loading, databasesLoading } = useLoginContext()
  const isLoading = loading || databasesLoading

  if (authContext) return <Navigate to="/" />

  return (
    <section className="bg-background flex h-screen w-full items-center overflow-auto">
      {/* Sidebox  */}
      <SideBox />

      <div
        className={`relative m-auto flex w-[480px] flex-col gap-6 rounded-md px-10 py-10 ${isLoading ? 'pointer-events-none opacity-70' : ''}`}
      >
        {/* Loader */}
        {isLoading && <SpinnerBotLoader className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80" size={28} />}

        <header className="flex flex-col items-center gap-3">
          <h1 className="text-primary text-xl font-bold">Inicia sesión con tu cuenta</h1>
          <p className="text-secondary flex gap-1 text-sm">
            <span>¿Solo buscas objetos de producción?</span>
            <Link to="/aligment" className="text-palette-primary-main hover:underline">
              Empieza aquí
            </Link>
          </p>
        </header>

        {/* Formulario */}
        <Form />
      </div>
    </section>
  )
}
