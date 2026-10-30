import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { RelationList } from '@/components/relations'
import type { SysObjectRelation } from '@/models/sysobject'

const navigable: SysObjectRelation = { id: 1, name: 'TblBase', schemaName: 'dbo', typeDesc: 'USER_TABLE' }
const unresolved: SysObjectRelation = { id: null, name: 'SinResolver', schemaName: null, typeDesc: 'VIEW' }

/** Renderiza un bloque de relaciones con los items dados. */
function renderList(items: SysObjectRelation[]) {
  return render(
    <RelationList
      title="Dependencias"
      description="Objetos que este objeto utiliza."
      items={items}
      emptyMessage="Sin dependencias."
      onSelect={vi.fn()}
    />,
  )
}

describe('RelationList', () => {
  it('muestra el icono de navegacion solo en la fila navegable', () => {
    const { container } = renderList([navigable, unresolved])

    const navigableRow = screen.getByRole('button', { name: /TblBase/ })
    expect(navigableRow.querySelector('[class*="arrow-up-right"]')).not.toBeNull()
    expect(navigableRow.querySelector('[class*="link-2-off"]')).toBeNull()

    const unresolvedRow = screen.getByText('SinResolver').closest('div') as HTMLElement
    expect(unresolvedRow.querySelector('[class*="link-2-off"]')).not.toBeNull()
    expect(unresolvedRow.querySelector('[class*="arrow-up-right"]')).toBeNull()

    // Solo la fila navegable expone la flecha de "abre otra pantalla".
    expect(container.querySelectorAll('[class*="arrow-up-right"]')).toHaveLength(1)
  })

  it('usa un chip con contorno para el tipo de objeto', () => {
    renderList([navigable])

    const badge = screen.getByText('USER_TABLE')
    expect(badge.className).toMatch(/border-border/)
    expect(badge.className).not.toMatch(/bg-background-neutral/)
  })
})
