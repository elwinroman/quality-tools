import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { NEUTRAL_TOAST_CLASS } from '@/components/ui/sonner'
import { Error500 } from '@/pages'
import { useAuthStore } from '@/zustand'

import { EditorCodeAligment, HeaderEditor, MenuSidebar } from './components'
import { useSearchContext } from './hooks'
import { useAligmentStore } from './zustand/aligment.store'

export function AligmentPage() {
  const errorApiConnection = useAuthStore((state) => state.errorApiConnection)
  const hideMenu = useAligmentStore((state) => state.hideMenu)
  const updateHideMenu = useAligmentStore((state) => state.updateHideMenu)
  const { error } = useSearchContext()

  // notificación de errores (evita repetir el toast si el error no cambió)
  const lastErrorRef = useRef(error)
  useEffect(() => {
    if (error && error !== lastErrorRef.current) {
      toast('Información', {
        className: NEUTRAL_TOAST_CLASS,
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
        <MenuSidebar className="w-sidebar shadow-xl" isCollapsed={hideMenu} onToggleSidebar={() => updateHideMenu(!hideMenu)} />
      </aside>

      {/* Main content */}
      <main className="flex min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out">
        <HeaderEditor />

        {/* Editor code */}
        <EditorCodeAligment />
      </main>
    </section>
  )
}
