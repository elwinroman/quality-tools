import type { ReactNode } from 'react'

import { CollapsibleSection } from './CollapsibleSection'

interface Props {
  /** Etiqueta del grupo, p. ej. "Globales" o "BD actual · RRHH". */
  label: string
  /** Cantidad de ítems del grupo. */
  count: number
  children: ReactNode
}

/**
 * Grupo colapsable de favoritos por alcance.
 * La raíz es un `<li>` para anidar válidamente dentro del `<ul>` de la sección padre;
 * `CollapsibleSection` aporta su propio `<ul>` para los ítems.
 */
export function FavoritosGroup({ label, count, children }: Props) {
  return (
    <li>
      <CollapsibleSection title={label} badge={count}>
        {children}
      </CollapsibleSection>
    </li>
  )
}
