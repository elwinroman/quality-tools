import { Laptop, Lock, Server } from 'lucide-react'
import { type RefObject, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'

import { CopyCode } from '@/components/editor-option'
import {
  DIFF_PANEL_LOCAL_BADGE,
  DIFF_PANEL_LOCAL_LABEL,
  DIFF_PANEL_PRODUCTION_BADGE,
  DIFF_PANEL_PRODUCTION_LABEL,
  DIFF_PANEL_READ_ONLY_HINT,
  DIFF_PANEL_SELECTOR,
  DIFF_PANEL_TONE,
  type DiffPanelTone,
} from '@/constants'
import { useAuthStore } from '@/zustand'

interface Props {
  originalCode: string
  modifiedCode: string
  renderSideBySide: boolean
}

/**
 * Estructura comun a ambos paneles. El fondo y el color de texto viven en cada
 * tono, porque ahora cada entorno tiene su propia identidad cromatica.
 */
const PANEL_HEADER_BASE = 'flex items-center justify-between border-l-2 px-4 py-0 text-xs'

/**
 * Identidad visual de cada entorno.
 *
 * Produccion usa el pink identidad y el objeto local el champagne identidad de
 * Gentle Shell (`#E0C27A`, champagne-400), asi que izquierda y derecha se leen de
 * inmediato por color. Se suman igual el icono (servidor vs equipo local), el
 * candado de solo lectura y el texto del badge, para que la distincion nunca
 * dependa solo del color.
 *
 * Contrastes medidos del texto sobre su propio card: produccion 6.39:1 en claro
 * y 12.37:1 en oscuro; local 5.74:1 en claro y 9.78:1 en oscuro.
 *
 * En oscuro el amarillo necesita menos presencia que el pink: su luminancia es la
 * mas alta del espectro, asi que el mismo contraste numerico se percibe mucho mas
 * fuerte. Por eso el card local usa `champagne-950/55`, que queda en 34% de
 * saturacion y 0.0115 de luminancia contra el 41% y 0.0108 del card pink, o sea
 * practicamente el mismo peso visual.
 */
const PANEL_TONES: Record<DiffPanelTone, { container: string; badge: string; icon: typeof Server; readOnly?: boolean }> = {
  production: {
    container: 'bg-gentle-pink-100 text-gentle-pink-700 border-gentle-pink-500/60 dark:bg-gentle-pink-900/70 dark:text-gentle-pink-200',
    badge: 'border-gentle-pink-500/40 bg-gentle-pink-200/50 dark:bg-gentle-pink-900/40',
    icon: Server,
    readOnly: true,
  },
  local: {
    container:
      'bg-champagne-200 text-champagne-800 border-champagne-500 dark:bg-champagne-950/55 dark:text-champagne-400 dark:border-champagne-700',
    badge: 'border-champagne-500/40 bg-champagne-300/50 dark:bg-champagne-900/40',
    icon: Laptop,
  },
}

interface PanelHeaderProps {
  tone: DiffPanelTone
  label: string
  badge: string
  code: string
  database?: string
}

function PanelHeader({ tone, label, badge, code, database }: PanelHeaderProps) {
  const { container, badge: badgeClass, icon: Icon, readOnly } = PANEL_TONES[tone]

  return (
    <div className={`${PANEL_HEADER_BASE} ${container}`}>
      <div className="flex items-center gap-2">
        <Icon size={14} aria-hidden />
        <p>
          <span className="pr-1">{label}</span>
          <span>{database}</span>
        </p>
        <span
          className={`inline-flex items-center gap-1 rounded-sm border px-1.5 text-[0.625rem] font-semibold tracking-wide ${badgeClass}`}
          title={readOnly ? DIFF_PANEL_READ_ONLY_HINT : undefined}
        >
          {readOnly && <Lock size={9} aria-hidden />}
          {badge}
        </span>
      </div>
      <CopyCode text={code} />
    </div>
  )
}

/** Inyecta y actualiza dinámicamente componentes React dentro del Monaco DiffEditor */
export function useInjectionComponent({ originalCode, modifiedCode, renderSideBySide }: Props) {
  const authContext = useAuthStore((state) => state.authContext)

  const panels = useRef([
    {
      rootRef: useRef<ReactDOM.Root | null>(null),
      containerRef: useRef<HTMLDivElement | null>(null),
      selector: DIFF_PANEL_SELECTOR.production,
    },
    {
      rootRef: useRef<ReactDOM.Root | null>(null),
      containerRef: useRef<HTMLDivElement | null>(null),
      selector: DIFF_PANEL_SELECTOR.local,
    },
  ]).current

  /** Busca o crea el contenedor de inyección dentro del target de Monaco */
  const ensureContainer = (target: Element, ref: RefObject<HTMLDivElement | null>) => {
    if (!ref.current) {
      const existing = target.querySelector('.injected-component') as HTMLDivElement | null
      if (existing) {
        ref.current = existing
      } else {
        const container = document.createElement('div')
        container.className = 'injected-component'
        target.insertBefore(container, target.firstChild)
        ref.current = container
      }
    }
    return ref.current
  }

  /** Inicializa un root de React en el contenedor si no existe */
  const initializeRoot = (containerRef: RefObject<HTMLDivElement | null>, rootRef: RefObject<ReactDOM.Root | null>) => {
    if (!rootRef.current && containerRef.current) {
      rootRef.current = ReactDOM.createRoot(containerRef.current)
    }
    return rootRef.current
  }

  const observerRef = useRef<MutationObserver | null>(null)

  const render = () => {
    for (const panel of panels) {
      const target = document.querySelector(panel.selector)
      if (!target) return
      panel.containerRef.current = ensureContainer(target, panel.containerRef)
    }

    const [original, modified] = panels
    const originalRoot = initializeRoot(original.containerRef, original.rootRef)
    const modifiedRoot = initializeRoot(modified.containerRef, modified.rootRef)
    if (!originalRoot || !modifiedRoot) return

    const panelConfigs = [
      {
        root: originalRoot,
        tone: DIFF_PANEL_TONE.production,
        label: DIFF_PANEL_PRODUCTION_LABEL,
        badge: DIFF_PANEL_PRODUCTION_BADGE,
        database: authContext?.prodDatabase,
        code: originalCode,
      },
      {
        root: modifiedRoot,
        tone: DIFF_PANEL_TONE.local,
        label: DIFF_PANEL_LOCAL_LABEL,
        badge: DIFF_PANEL_LOCAL_BADGE,
        database: authContext?.database,
        code: modifiedCode,
      },
    ]

    for (const { root, tone, label, badge, database, code } of panelConfigs) {
      root.render(<>{renderSideBySide && <PanelHeader tone={tone} label={label} badge={badge} database={database} code={code} />}</>)
    }
  }

  /** Espera a que los nodos de Monaco existan en el DOM antes de renderizar */
  const waitForNodesAndRender = () => {
    // Si los nodos ya existen, renderizar directo
    const allExist = panels.every((p) => document.querySelector(p.selector))
    if (allExist) {
      render()
      return
    }

    // Si no, observar el DOM hasta que aparezcan
    observerRef.current?.disconnect()
    observerRef.current = new MutationObserver(() => {
      const ready = panels.every((p) => document.querySelector(p.selector))
      if (ready) {
        observerRef.current?.disconnect()
        observerRef.current = null
        render()
      }
    })
    observerRef.current.observe(document.body, { childList: true, subtree: true })
  }

  const cleanup = () => {
    observerRef.current?.disconnect()
    observerRef.current = null
    for (const panel of panels) {
      panel.rootRef.current?.unmount()
      panel.rootRef.current = null
      panel.containerRef.current = null
    }
  }

  useEffect(() => {
    waitForNodesAndRender()
    return cleanup
  }, [originalCode, modifiedCode, renderSideBySide])

  return { render }
}
