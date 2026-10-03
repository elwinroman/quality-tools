import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AuthContext } from '@/models'
import type { FullSysObject } from '@/models/sysobject'
import { SQLDefinitionPage } from '@/pages/SQLDefinition/SQLDefinitionPage'
import { useSysObjectStore } from '@/pages/SQLDefinition/store/sysobject.store'
import { useAppStore, useAuthStore, useEditorTabsStore } from '@/zustand'

// El editor Monaco y el header real no hacen falta para validar la memoria del tab
vi.mock('@/pages/SQLDefinition/components', () => ({
  EditorCode: () => <div data-testid="editor-code" />,
  HeaderEditor: (props: { activeTab: string }) => <div data-testid="active-tab">{props.activeTab}</div>,
  OverviewContent: () => null,
}))

vi.mock('@/pages/SQLDefinition/components/diff-script-content/DiffScriptContent', () => ({
  DiffScriptContent: () => null,
}))

// El provider de favoritos llama a la API al montar: se stubbea el hook para no hacer red
vi.mock('@/components/favoritos/hooks/useFavoritos', () => ({
  useFavoritos: () => ({
    favoritos: [],
    getFavoritos: () => {},
    upsertFavorito: () => {},
    deleteFavorito: () => {},
    isFavorito: () => undefined,
    loading: false,
  }),
}))

beforeAll(() => {
  // jsdom no implementa matchMedia: la página se renderiza como mobile, con el sidebar cerrado
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }))
})

beforeEach(() => {
  useEditorTabsStore.setState({ usertableTab: null, sqlDefinitionTab: 'Compare' })
  useSysObjectStore.setState({ sysobject: { schemaName: 'dbo', name: 'Vista' } as FullSysObject })
  useAuthStore.setState({ authContext: null })
  useAppStore.setState({ switchingDatabase: null })
})

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/sqldefinition/dbo.Vista']}>
      <Routes>
        <Route path="/sqldefinition/:qualifiedName" element={<SQLDefinitionPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SQLDefinitionPage — memoria del tab Compare', () => {
  it('no clobbera el tab Compare recordado en el primer commit', () => {
    renderPage()

    // Los effects de invalidación de Compare no deben correr en el mount:
    // solo cuando database o sysobject cambian de verdad
    expect(screen.getByTestId('active-tab')).toHaveTextContent('Compare')
    expect(useEditorTabsStore.getState().sqlDefinitionTab).toBe('Compare')
  })

  it('invalida Compare cuando database cambia de verdad', () => {
    renderPage()
    expect(useEditorTabsStore.getState().sqlDefinitionTab).toBe('Compare')

    act(() => {
      useAuthStore.setState({ authContext: { database: 'otra_base' } as AuthContext })
    })

    expect(screen.getByTestId('active-tab')).toHaveTextContent('Script')
    expect(useEditorTabsStore.getState().sqlDefinitionTab).toBe('Script')
  })

  it('invalida Compare cuando sysobject cambia de verdad', () => {
    renderPage()
    expect(useEditorTabsStore.getState().sqlDefinitionTab).toBe('Compare')

    act(() => {
      // switchingDatabase bloquea el fetch del effect de ruta: acá solo importa el effect de Compare
      useAppStore.getState().updateSwitchingDatabase('db1')
      useSysObjectStore.setState({ sysobject: { schemaName: 'dbo', name: 'OtraVista' } as FullSysObject })
    })

    expect(screen.getByTestId('active-tab')).toHaveTextContent('Script')
    expect(useEditorTabsStore.getState().sqlDefinitionTab).toBe('Script')
  })
})
