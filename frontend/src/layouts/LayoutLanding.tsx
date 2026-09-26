import type { ReactNode } from 'react'

import { DatabaseSwitchOverlay } from '@/components/loader'
import { LandingNavbar } from '@/components/navbar/LandingNavbar'

interface LayoutLandingProps {
  children: ReactNode
}

export function LayoutLanding({ children }: LayoutLandingProps) {
  return (
    <section className="bg-baselayer h-full w-full overflow-auto">
      <LandingNavbar />
      <main className="relative w-full">
        <DatabaseSwitchOverlay />
        <div className="w-full">{children}</div>

        <footer className="py-6">
          <p className="text-secondary flex flex-col items-center gap-1 text-sm">
            <span>
              © 2026 <strong>Departamento de Aseguramiento de Calidad</strong>
            </span>
          </p>
        </footer>
      </main>
    </section>
  )
}
