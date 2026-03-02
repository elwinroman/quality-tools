import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { Error500 } from '@/pages'
import { useAuthStore } from '@/zustand'

import { EditorCodeAligment, HeaderEditor, MenuSidebar } from './components'
import { useSearchContext } from './hooks'
import { useAligmentStore } from './zustand/aligment.store'

export function AligmentPage() {
  const errorApiConnection = useAuthStore((state) => state.errorApiConnection)
  const hideMenu = useAligmentStore((state) => state.hideMenu)
  const { error } = useSearchContext()

  // notificación de errores (evita repetir el toast si el error no cambió)
  const lastErrorRef = useRef(error)
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      toast.warning('Warning', {
        description: error.detail,
        duration: 6000,
      })
    }
    lastErrorRef.current = error
  }, [error])

  if (errorApiConnection) return <Error500 />

  return (
    <section className="relative flex h-screen w-full overflow-hidden">
      {/* Sidebar con slide-in/out efecto */}
      <aside
        className={`bg-background relative hidden h-full transition-all duration-300 ease-in-out sm:block ${hideMenu ? 'w-0 overflow-hidden opacity-0' : `w-sidebar opacity-100`} `}
      >
        <MenuSidebar className={`w-sidebar bg-background h-full flex-col sm:flex`} />
      </aside>

      {/* Main content */}
      <main className={`flex flex-1 flex-col transition-all duration-300 ease-in-out ${hideMenu ? 'w-full' : 'w-content-area'} `}>
        <HeaderEditor />

        {/* Editor code */}
        <EditorCodeAligment />

        <footer className="text-muted grid place-content-center py-2 text-sm">
          <span>
            © 2026 <strong>Departamento de Aseguramiento de Calidad</strong>
          </span>
        </footer>
      </main>
    </section>
  )
}
