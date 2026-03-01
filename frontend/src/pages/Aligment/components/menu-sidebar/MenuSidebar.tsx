import { useSearchContext } from '@aligment/hooks'
import { LayoutGrid, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { CircleLoader } from '@/components/loader'
import { LoginUsername, ThemeToggle } from '@/components/navbar/components'
import { Button, Checkbox } from '@/components/ui'
import { AppRoutes } from '@/constants'
import { APP_SHORT_NAME } from '@/enviroment/enviroment'
import { useAppStore, useAuthStore } from '@/zustand'

import { ButtonGroup, SearchAligment, ViewModeSelect } from './components'

interface Props {
  className?: string
}

export function MenuSidebar({ className = '' }: Props) {
  const navigate = useNavigate()
  const authContext = useAuthStore((state) => state.authContext)
  const isDark = useAppStore((state) => state.isDark)
  const { loading } = useSearchContext()

  const backHome = () => navigate(AppRoutes.Home)
  const redirectLogin = () => navigate(AppRoutes.Login)

  return (
    <nav className={`border-border border-r shadow-xl ${className}`}>
      <header className="flex items-center px-6 py-3">
        {authContext ? (
          <Button variant={'ghost'} size="sm" className="flex items-center gap-2" onClick={backHome}>
            <LayoutGrid size={16} />
            <span className="underline">Home</span>
          </Button>
        ) : (
          <div className="flex w-full items-center justify-between">
            <span className="text-primary font-bold">{APP_SHORT_NAME}</span>
            <ThemeToggle />
          </div>
        )}
      </header>

      <div className="grow overflow-x-hidden overflow-y-auto px-4 py-6 md:px-6">
        <div className="flex flex-col gap-6">
          {/* Texto */}
          <div className="flex flex-col gap-3">
            <h4 className="text-primary/90 text-sm font-bold">CONSULTA DE OBJETOS PARA ALINEACIÓN</h4>

            <p className="text-secondary text-sm text-pretty">
              <span>Recupera los objetos alineados a </span>
              <strong>pre-producción </strong>
              <span>y dí adios a observaciones por desvío de ambientes </span>
              <span className="text-palette-primary-main">(Actualizado al día de ayer)</span>
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {/* Radio options */}
            <ViewModeSelect />

            {/* Input */}
            <SearchAligment />
          </div>

          {/* Términos y condiciones */}
          <div>
            <label className="flex gap-2">
              <Checkbox disabled={true} checked={true} className="mt-1" />
              <span className="text-secondary text-[14px]">Al realizar la consulta acepto que mis datos sean recopilados.</span>
            </label>
          </div>

          {/* Buttons */}
          <ButtonGroup />

          {/* Loader */}
          {loading && (
            <div className="relative mt-4">
              <CircleLoader size={20} visible={true} color={isDark ? 'white' : 'black'} />
            </div>
          )}
        </div>

        {/* objeto copia */}
        <div className="h-14 min-h-14 w-full bg-none"></div>
      </div>

      <footer className="bg-background/85 absolute bottom-0 flex h-14 min-h-14 w-[calc(100%-20px)] items-center px-6 backdrop-blur-sm">
        {!authContext ? (
          <button className="hover:bg-action-hover flex h-10 items-center gap-2 rounded-sm px-2 transition-colors" onClick={redirectLogin}>
            <User size={18} />
            <span className="text-sm">Iniciar sesión</span>
          </button>
        ) : (
          <LoginUsername />
        )}
      </footer>
    </nav>
  )
}
