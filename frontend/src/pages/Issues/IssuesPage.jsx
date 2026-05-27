import { Laptop, Shredder } from 'lucide-react'

import { DatabaseSwitchOverlay } from '@/components/loader'
import { Navbar } from '@/components/navbar/Navbar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SearchFilter } from '@/pages/Issues/components/Filter'

export function IssuesPage() {
  return (
    <section className="bg-background flex h-full w-full flex-col">
      <Navbar />
      <main className="relative h-full w-full overflow-auto px-4 py-4">
        <DatabaseSwitchOverlay />
        <SearchFilter />
        <h1>Issues</h1>

        {/* Error Details */}
        <section className="mt-10">
          <h2 className="font-bold">System.FormatException</h2>

          <div>
            <h3>Eventos</h3>
            <div className="border-border flex flex-col items-start rounded-sm border">
              {/* Header */}
              <header className="flex w-full gap-6 border-b px-3 py-3 text-sm">
                <div className="text-primary font-semibold">ID: cb6843779f2b4bfc83142b8a31c1363b</div>
                <div className="text-secondary border-b border-dashed">hace 5 días</div>
              </header>

              {/* Body */}
              <article className="flex w-full flex-col gap-4 px-4 py-4">
                {/* Info cabecera */}
                <div className="flex items-center gap-6 border-b pb-4">
                  <div className="text-primary flex items-center gap-1 text-sm">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">H</AvatarFallback>
                    </Avatar>
                    <span>hhinostroza</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-500">
                    <Laptop size={16} strokeWidth="2" />
                    <span>DC220I22B0</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-cyan-600 dark:text-cyan-500">
                    <Shredder size={16} strokeWidth="2" />
                    <span>Aplicación</span>
                    <span className="text-secondary">01</span>
                  </div>
                </div>

                {/* Mensaje */}
                <div className="flex flex-col gap-1 border-b pb-4">
                  <h4 className="font-semibold">Mensaje</h4>
                  <p className="text-sm">Se produjo una excepción en el destino de invcación</p>
                </div>

                {/* Stack Trace */}
                <div className="flex flex-col gap-1 border-b pb-4">
                  <h4 className="font-semibold">Stack Trace</h4>
                  <p className="text-sm">Se produjo una excepción en el destino de invcación</p>
                </div>

                {/* Contexto */}
                <div className="flex flex-col gap-1">
                  <h4 className="font-semibold">Contexto</h4>

                  {/* Usuario auditor */}
                  <div className="flex flex-col gap-1 rounded-sm border p-2">
                    {/* Header */}
                    <header className="flex justify-between">
                      <span className="text-sm font-semibold">Usuario auditor</span>
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">H</AvatarFallback>
                      </Avatar>
                    </header>

                    {/*  Body */}
                    {/* esto debe ser un componente con arrays */}
                    <div className="text-muted font-fira bg-action-hover flex items-start space-x-4 rounded-sm px-1 py-0.5 text-xs">
                      <span className="text-secondary w-[150px] overflow-hidden text-nowrap">Nombre</span>
                      <span className="text-primary/90">hhinostroza</span>
                    </div>
                    <div className="text-muted font-fira flex items-start space-x-4 px-1 text-xs">
                      <span className="text-secondary w-[150px] overflow-hidden text-nowrap">Estación</span>
                      <span className="text-primary/90">DC220I22B0</span>
                    </div>
                    <div className="text-muted font-fira flex items-start space-x-4 px-1 text-xs">
                      <span className="text-secondary w-[150px] overflow-hidden text-nowrap">Cliente</span>
                      <span className="text-primary/90">.Net SqlClientConnection</span>
                    </div>
                    <div className="text-muted font-fira flex items-start space-x-4 px-1 text-xs">
                      <span className="text-secondary w-[150px] overflow-hidden text-nowrap">Fecha de operación</span>
                      <span className="text-primary/90">Abril 22, 2025 3:00:02 PM -05</span>
                    </div>
                  </div>

                  {/* Usuario auditor */}
                  <div className="flex flex-col gap-1 rounded-sm border p-2">
                    {/* Header */}

                    {/*  Body */}
                    {/* esto debe ser un componente con arrays */}
                    <div className="text-muted font-fira bg-action-hover flex items-start space-x-4 rounded-sm px-1 py-0.5 text-xs">
                      <span className="text-secondary w-[180px] overflow-hidden text-nowrap">Proyecto</span>
                      <span className="text-primary/90">SoltIntEs</span>
                    </div>
                    <div className="text-muted font-fira flex items-start space-x-4 px-1 text-xs">
                      <span className="text-secondary w-[180px] overflow-hidden text-nowrap">Formulario</span>
                      <span className="text-primary/90">frm_Inicio</span>
                    </div>
                    <div className="text-muted font-fira flex items-start space-x-4 px-1 text-xs">
                      <span className="text-secondary w-[180px] overflow-hidden text-nowrap">Objeto, procedimiento, función</span>
                      <span className="text-primary/90">CreateInstance</span>
                    </div>
                    <div className="text-muted font-fira flex items-start space-x-4 px-1 text-xs">
                      <span className="text-secondary w-[180px] overflow-hidden text-nowrap">Tipo de error</span>
                      <span className="text-primary/90">01: SQL</span>
                    </div>
                    <div className="text-muted font-fira flex items-start space-x-4 px-1 text-xs">
                      <span className="text-secondary w-[180px] overflow-hidden text-nowrap">Linea</span>
                      <span className="text-primary/90">210</span>
                    </div>
                    <div className="text-muted font-fira flex items-start space-x-4 px-1 text-xs">
                      <span className="text-secondary w-[180px] overflow-hidden text-nowrap">Fecha de generación</span>
                      <span className="text-primary/90">Abril 22, 2025 3:00:02 PM -05</span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </section>
  )
}
