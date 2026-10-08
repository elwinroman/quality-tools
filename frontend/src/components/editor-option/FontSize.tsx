import { AArrowDown, AArrowUp } from 'lucide-react'

import { useEditorOptionsStore } from '@/zustand'

/** Los tres botones comparten la misma superficie; solo cambia si muestran icono o valor. */
const BUTTON_CLASS = 'text-primary hover:bg-action-hover grid w-7 place-content-center transition-colors'

/**
 * Control compacto de tamano de fuente.
 *
 * Lleva `shrink-0` porque su padre es una fila flex: sin eso se comprime y el
 * contenido desborda en X. El borde vive en el contenedor y los separadores en el
 * valor, para no dibujar lineas de 1px duplicadas entre las piezas.
 */
export function FontSize() {
  const fontSize = useEditorOptionsStore((state) => state.fontSize)
  const updateFontSize = useEditorOptionsStore((state) => state.updateFontSize)

  const handleClickUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    updateFontSize(fontSize + 1)
  }

  const handleClickDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    updateFontSize(fontSize - 1)
  }

  return (
    <div className="border-border bg-background-card flex h-7 shrink-0 items-stretch overflow-hidden rounded-sm border">
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={handleClickDown}
        aria-label="Reducir tamaño de fuente"
        title="Reducir tamaño de fuente"
      >
        <AArrowDown size={14} />
      </button>

      <div className="border-border bg-background-neutral grid min-w-8 place-content-center border-x">
        <span className="px-1.5 text-xs tabular-nums">{fontSize}</span>
      </div>

      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={handleClickUp}
        aria-label="Aumentar tamaño de fuente"
        title="Aumentar tamaño de fuente"
      >
        <AArrowUp size={14} />
      </button>
    </div>
  )
}
