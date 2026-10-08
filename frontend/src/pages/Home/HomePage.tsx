import { Link } from 'react-router-dom'

import { AppRoutes } from '@/constants'
import { APP_NAME, ENABLE_REPO_LINK, GITHUB_REPOSITORIO_LINK } from '@/enviroment/enviroment'

import { InfoAligment } from './components/InfoAligment'
import { InfoSqlDefinition } from './components/InfoSqlDefinition'
import { InfoUsertable } from './components/InfoUsertable'

/**
 * Marca de GitHub como SVG inline (no depende de lucide-react).
 * `aria-hidden`: el `<a>` padre ya tiene el texto "Repositorio".
 */
function GitHubMarkIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

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

          {ENABLE_REPO_LINK && (
            <a
              href={GITHUB_REPOSITORIO_LINK}
              target="_blank"
              rel="noreferrer"
              className="text-secondary hover:text-primary inline-flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <GitHubMarkIcon size={16} />
              <span>Repositorio</span>
            </a>
          )}
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
            description="Detecta y resuelve diferencias entre tus bases de datos de prueba y producción con comparación visual side-by-side de scripts SQL."
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
