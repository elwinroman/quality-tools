import { HardDrive } from 'lucide-react'
import { type RefObject, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'

import { CopyCode } from '@/components/editor-option'
import { useAuthStore } from '@/zustand'

interface Props {
  originalCode: string
  modifiedCode: string
  renderSideBySide: boolean
}

function PanelHeader({ label, database, code }: { label: string; database?: string; code: string }) {
  return (
    <div className="bg-background-alternate text-secondary flex items-center justify-between px-4 py-0 text-xs">
      <div className="flex items-center gap-2">
        <HardDrive size={14} />
        <p>
          <span className="pr-1">{label}</span>
          <span>{database}</span>
        </p>
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
      selector: '.side-by-side .editor.original',
    },
    {
      rootRef: useRef<ReactDOM.Root | null>(null),
      containerRef: useRef<HTMLDivElement | null>(null),
      selector: '.side-by-side .editor.modified',
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
      { root: originalRoot, label: 'BD Producción:', database: authContext?.prodDatabase, code: originalCode },
      { root: modifiedRoot, label: 'BD Pruebas:', database: authContext?.database, code: modifiedCode },
    ]

    for (const { root, label, database, code } of panelConfigs) {
      root.render(<>{renderSideBySide && <PanelHeader label={label} database={database} code={code} />}</>)
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
