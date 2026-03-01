import { Link } from 'react-router-dom'

import { AppRoutes } from '@/constants'
import { APP_NAME } from '@/enviroment/enviroment'

import { InfoAligment } from './components/InfoAligment'
import { InfoSqlDefinition } from './components/InfoSqlDefinition'
import { InfoUsertable } from './components/InfoUsertable'

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[88vh] flex-col items-center justify-center overflow-hidden px-4 py-24 text-center">
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="border-border text-secondary inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium">
            <span className="bg-palette-success-main h-1.5 w-1.5 rounded-full" />
            Microsoft SQL Server
          </div>

          <div className="flex flex-col gap-5">
            <h1 className="max-w-4xl font-['Barlow'] text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
              Gestiona metadatos con
              <br />
              <span className="gradient-text">{APP_NAME}</span>
            </h1>
            <p className="text-secondary mx-auto max-w-2xl text-xl text-balance">
              Explora definiciones SQL, inspecciona estructuras de tablas y alinea entornos de bases de datos desde una sola interfaz.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to={AppRoutes.SQL_DEFINITION}
              className="bg-primary text-primary-foreground rounded-lg px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-80"
            >
              Comenzar ahora
            </Link>
            <a
              href="#herramientas"
              className="border-border text-secondary hover:text-primary rounded-lg border px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              Ver herramientas ↓
            </a>
          </div>
        </div>

        <div className="main-background" />
      </section>

      <div id="herramientas" />

      {/* SQL Definition */}
      <section className="border-border bg-background w-full border-t py-24">
        <div className="mx-auto max-w-(--breakpoint-xl) px-4 md:px-6">
          <SectionHeader
            label="01 — SQL Definition"
            title="Definiciones SQL"
            description="Consulta el código fuente de tus objetos SQL directamente desde los metadatos del servidor. Soporte para procedimientos almacenados, funciones, vistas, triggers y más."
          />
          <InfoSqlDefinition />
          <div className="mt-10">
            <Link to={AppRoutes.SQL_DEFINITION} className="text-secondary hover:text-primary text-sm font-medium transition-colors">
              Ir a SQL Definition →
            </Link>
          </div>
        </div>
      </section>

      {/* Usertable */}
      <section className="bg-background-neutral w-full py-24">
        <div className="mx-auto max-w-(--breakpoint-xl) px-4 md:px-6">
          <SectionHeader
            label="02 — Usertable"
            title="Tablas de usuario"
            description="Inspeccioná la estructura completa de tus tablas de usuario: columnas, tipos de datos, índices y relaciones en un panel resizable e intuitivo."
          />
          <InfoUsertable />
          <div className="mt-10">
            <Link to={AppRoutes.USERTABLE} className="text-secondary hover:text-primary text-sm font-medium transition-colors">
              Ir a Usertable →
            </Link>
          </div>
        </div>
      </section>

      {/* Alignment */}
      <section className="border-border bg-background w-full border-t py-24">
        <div className="mx-auto max-w-(--breakpoint-xl) px-4 md:px-6">
          <SectionHeader
            label="03 — Aligment"
            title="Alineación de entornos"
            description="Detecta y resuelve diferencias entre tus bases de datos de prueba y pre-producción con comparación visual side-by-side de scripts SQL."
          />
          <InfoAligment />
          <div className="mt-10">
            <Link to={AppRoutes.Aligment} className="text-secondary hover:text-primary text-sm font-medium transition-colors">
              Ir a Aligment →
            </Link>
          </div>
        </div>
      </section>

      <div className="main-background" />
    </>
  )
}

function SectionHeader({ label, title, description }: { label: string; title: string; description: string }) {
  return (
    <div className="mb-12 flex flex-col gap-3">
      <span className="text-muted text-xs font-bold tracking-widest uppercase">{label}</span>
      <h2 className="font-['Barlow'] text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="text-secondary max-w-2xl text-balance">{description}</p>
    </div>
  )
}
