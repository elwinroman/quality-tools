import { X } from 'lucide-react'

import { useDismissibleNotice } from '@/hooks/useDismissibleNotice'

/**
 * Aviso de Aligment: de qué se trata la consulta y qué devuelve.
 *
 * Al cerrarlo queda recordado por unos días, así no reaparece en cada refresco.
 *
 * Lleva `dark` para forzar la paleta oscura en este subárbol: el aviso busca contrastar
 * con el sidebar en los dos temas, y así los tokens resuelven a sus valores oscuros sin
 * hardcodear color.
 */
export function InfoCard() {
  const { isVisible, dismiss } = useDismissibleNotice('aligment-info')

  if (!isVisible) return null

  return (
    <aside className="dark border-border bg-background-neutral relative mx-4 rounded-sm border p-3">
      <button
        type="button"
        className="text-secondary hover:text-primary border-border hover:bg-action-hover absolute top-2 right-2 grid h-5 w-5 cursor-pointer place-content-center rounded-full border transition-colors"
        onClick={dismiss}
        aria-label="Cerrar el aviso"
      >
        <X size={12} />
      </button>

      <div className="flex flex-col gap-2 pr-6">
        <h4 className="text-primary/90 text-xs font-bold">CONSULTA PARA ALINEACIÓN</h4>

        <p className="text-secondary text-xs text-pretty">
          Recupera los objetos alineados a producción y dí adios a observaciones por desvío de ambientes. (Actualizado al día de ayer)
        </p>
      </div>
    </aside>
  )
}
