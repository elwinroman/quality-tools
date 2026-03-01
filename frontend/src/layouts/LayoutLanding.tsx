import type { ReactNode } from 'react'

import { Navbar } from '@/components/navbar/Navbar'

interface LayoutLandingProps {
  children: ReactNode
}

export function LayoutLanding({ children }: LayoutLandingProps) {
  return (
    <section className="bg-baselayer h-full w-full overflow-auto">
      <Navbar />
      <div className="w-full">
        <div className="w-full">{children}</div>

        <footer className="py-6">
          <p className="text-secondary flex flex-col items-center gap-1 text-sm">
            <span>
              © 2026 <strong>Departamento de Aseguramiento de Calidad</strong>
            </span>
          </p>
        </footer>
      </div>
    </section>
  )
}
