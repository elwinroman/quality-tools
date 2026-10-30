import { format } from '@formkit/tempo'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LOCAL_LANGUAJE } from '@/enviroment/enviroment'
import type { FullSysObject } from '@/models/sysobject'
import { OverviewContent } from '@/pages/SQLDefinition/components/OverviewContent'
import { useSysObjectStore } from '@/pages/SQLDefinition/store/sysobject.store'

/** Devuelve la fila de encabezado de un bloque de relaciones a partir de su titulo. */
function relationHeader(title: string) {
  return screen.getByText(title).parentElement?.parentElement as HTMLElement
}

/** Renderiza el Overview dentro del router (la navegacion por relacion lo requiere). */
function renderOverview() {
  render(
    <MemoryRouter>
      <OverviewContent />
    </MemoryRouter>,
  )
}

const baseSysobject: FullSysObject = {
  id: 12,
  name: 'CRE_Cliente',
  type: 'P',
  typeDesc: 'SQL_STORED_PROCEDURE',
  schemaId: 1,
  schemaName: 'dbo',
  createDate: '2024-03-25T00:00:00.000Z',
  modifyDate: '2024-03-26T00:00:00.000Z',
  definition: 'CREATE PROCEDURE dbo.CRE_Cliente AS SELECT 1',
  permission: [],
}

const originalFetchSysObjectRelations = useSysObjectStore.getState().fetchSysObjectRelations

function setStoreState(overrides: Partial<ReturnType<typeof useSysObjectStore.getState>> = {}) {
  useSysObjectStore.setState({
    sysobject: baseSysobject,
    dependencies: [],
    dependents: [],
    isLoadingRelations: false,
    errorRelations: null,
    fetchSysObjectRelations: originalFetchSysObjectRelations,
    ...overrides,
  })
}

describe('OverviewContent', () => {
  beforeEach(() => {
    setStoreState()
  })

  it('muestra el titulo Overview, la metadata en tres filas y los permisos dentro de la tarjeta', () => {
    setStoreState({
      sysobject: {
        ...baseSysobject,
        permission: [
          { name: 'Rol_Fin', permissionName: 'EXECUTE', stateDesc: 'GRANT' },
          { name: 'Rol_Admin', permissionName: 'SELECT', stateDesc: 'DENY' },
        ],
      },
    })

    renderOverview()

    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeInTheDocument()
    expect(screen.queryByText('Metadata')).not.toBeInTheDocument()

    expect(screen.getByText('Tipo')).toBeInTheDocument()
    expect(screen.getByText('Schema')).toBeInTheDocument()
    expect(screen.getByText('Object ID')).toBeInTheDocument()
    expect(screen.getByText('Creado')).toBeInTheDocument()
    expect(screen.getByText('Modificado')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('SQL_STORED_PROCEDURE (P)')).toBeInTheDocument()

    // Relaciones y Permisos viven dentro de la misma tarjeta que la metadata.
    const metadataCard = screen.getByText('Tipo').closest('.rounded-sm') as HTMLElement
    expect(metadataCard).not.toBeNull()
    expect(metadataCard).toContainElement(screen.getByRole('button', { name: /Relaciones/ }))
    expect(metadataCard).toContainElement(screen.getByText('Permisos'))

    // El rol, el verbo y el estado se muestran como texto (los chips se prueban por contenido).
    expect(metadataCard).toContainElement(screen.getByText('Rol_Fin'))
    expect(metadataCard).toContainElement(screen.getByText('Rol_Admin'))
    expect(metadataCard).toContainElement(screen.getByText('EXECUTE'))
    expect(metadataCard).toContainElement(screen.getByText('GRANT'))
    expect(metadataCard).toContainElement(screen.getByText('SELECT'))
    expect(metadataCard).toContainElement(screen.getByText('DENY'))

    // Ya no hay una tarjeta "Permisos" suelta al final: el label aparece una sola vez.
    expect(screen.getAllByText('Permisos')).toHaveLength(1)
  })

  it('muestra las fechas en formato corto dd/mm/yyyy y el formato largo en tooltip', async () => {
    renderOverview()

    const shortDate = format(baseSysobject.createDate, 'DD/MM/YYYY', LOCAL_LANGUAJE)
    const fullDate = format(baseSysobject.createDate, 'full', LOCAL_LANGUAJE)

    const trigger = screen.getByText(shortDate)
    expect(trigger).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    await userEvent.hover(trigger)

    // Radix renderiza el contenido del tooltip con role="tooltip" al abrirlo.
    expect(await screen.findByRole('tooltip')).toHaveTextContent(fullDate)
  })

  it('no muestra el nombre ni el schema como identidad separada', () => {
    renderOverview()

    // El nombre del objeto solo existia en el bloque de identidad, que ya no se renderiza.
    expect(screen.queryByText('CRE_Cliente')).not.toBeInTheDocument()
  })

  it('mantiene Relaciones colapsado sin badge y carga las relaciones una sola vez al expandirlo', async () => {
    const fetchSpy = vi.fn()
    setStoreState({
      fetchSysObjectRelations: fetchSpy,
      dependencies: [{ id: 1, name: 'TblBase', schemaName: 'dbo', typeDesc: 'USER_TABLE' }],
      dependents: [{ id: 2, name: 'VistaA', schemaName: 'dbo', typeDesc: 'VIEW' }],
    })

    renderOverview()

    const toggle = screen.getByRole('button', { name: /Relaciones/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Referencias')).not.toBeInTheDocument()
    expect(screen.queryByText('Dependencias')).not.toBeInTheDocument()
    expect(screen.queryByText('VistaA')).not.toBeInTheDocument()
    expect(fetchSpy).not.toHaveBeenCalled()

    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Objetos que utilizan este objeto.')).toBeInTheDocument()
    expect(screen.getByText('Objetos que este objeto utiliza.')).toBeInTheDocument()
    expect(relationHeader('Referencias')).toHaveTextContent('1')
    expect(relationHeader('Dependencias')).toHaveTextContent('1')
    expect(screen.getByText('VistaA')).toBeInTheDocument()
    expect(screen.getByText('TblBase')).toBeInTheDocument()

    // La fila Relaciones ya no muestra badge de conteo.
    expect(toggle.textContent).not.toMatch(/\d/)

    // Cerrar y volver a abrir no vuelve a disparar la carga.
    await userEvent.click(toggle)
    await userEvent.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('muestra los mensajes de vacio de las relaciones cuando no hay datos', async () => {
    setStoreState({ fetchSysObjectRelations: vi.fn() })

    renderOverview()

    await userEvent.click(screen.getByRole('button', { name: /Relaciones/ }))

    expect(screen.getByText('Sin referencias.')).toBeInTheDocument()
    expect(screen.getByText('Sin dependencias.')).toBeInTheDocument()
  })

  it('muestra la linea atenuada cuando no hay permisos', () => {
    setStoreState()

    renderOverview()

    const empty = screen.getByText('Sin permisos.')
    expect(empty).toBeInTheDocument()

    // El mensaje de vacio vive dentro de la tarjeta de metadata, no en una tarjeta aparte.
    const metadataCard = screen.getByText('Tipo').closest('.rounded-sm') as HTMLElement
    expect(metadataCard).toContainElement(empty)
    expect(screen.getAllByText('Permisos')).toHaveLength(1)
  })

  it('muestra todos los permisos cuando hay varios, cada uno con su verbo y su estado', () => {
    const permissions = [
      { name: 'Rol_Fin', permissionName: 'EXECUTE', stateDesc: 'GRANT' },
      { name: 'Rol_Admin', permissionName: 'SELECT', stateDesc: 'DENY' },
      { name: 'Rol_Lectura', permissionName: 'VIEW DEFINITION', stateDesc: 'GRANT' },
      { name: 'Rol_Escritura', permissionName: 'UPDATE', stateDesc: 'GRANT' },
      { name: 'Rol_Auditoria_Con_Nombre_Largo', permissionName: 'REFERENCES', stateDesc: 'GRANT' },
      { name: 'Rol_Aplicacion', permissionName: 'INSERT', stateDesc: 'GRANT' },
    ]

    setStoreState({ sysobject: { ...baseSysobject, permission: permissions } })

    renderOverview()

    // Ningun permiso se pierde: todos los roles aparecen con su fila.
    for (const permission of permissions) {
      expect(screen.getByText(permission.name)).toBeInTheDocument()
    }

    // Los chips se cuentan por valor: cada verbo y cada estado se renderiza tantas veces como aparece.
    expect(screen.getAllByText('EXECUTE')).toHaveLength(1)
    expect(screen.getAllByText('SELECT')).toHaveLength(1)
    expect(screen.getAllByText('VIEW DEFINITION')).toHaveLength(1)
    expect(screen.getAllByText('UPDATE')).toHaveLength(1)
    expect(screen.getAllByText('REFERENCES')).toHaveLength(1)
    expect(screen.getAllByText('INSERT')).toHaveLength(1)
    expect(screen.getAllByText('GRANT')).toHaveLength(5)
    expect(screen.getAllByText('DENY')).toHaveLength(1)

    // La lista es una grilla: con varios permisos se reparte en lugar de apilarse de a uno.
    const list = screen.getByText('Rol_Fin').closest('ul') as HTMLElement
    expect(list.className).toMatch(/grid/)
  })
})
