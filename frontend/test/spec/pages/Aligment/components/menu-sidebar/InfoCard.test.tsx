import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { InfoCard } from '@/pages/Aligment/components/menu-sidebar/components/InfoCard'

const STORAGE_KEY = 'dismissible-notice:aligment-info'

beforeEach(() => {
  localStorage.clear()
})

describe('InfoCard', () => {
  it('renderiza el aviso de alineación y permite cerrarlo', async () => {
    const user = userEvent.setup()
    render(<InfoCard />)

    expect(screen.getByRole('heading', { name: 'CONSULTA PARA ALINEACIÓN' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cerrar el aviso' }))

    expect(screen.queryByRole('heading', { name: 'CONSULTA PARA ALINEACIÓN' })).not.toBeInTheDocument()
    expect(Number(localStorage.getItem(STORAGE_KEY))).toBeGreaterThan(0)
  })

  it('no se muestra cuando el cierre sigue vigente (menos de 4 horas)', () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now() - 60 * 60 * 1000))

    render(<InfoCard />)

    expect(screen.queryByRole('heading', { name: 'CONSULTA PARA ALINEACIÓN' })).not.toBeInTheDocument()
  })

  it('vuelve a mostrarse cuando el cierre supera las 4 horas', () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now() - 5 * 60 * 60 * 1000))

    render(<InfoCard />)

    expect(screen.getByRole('heading', { name: 'CONSULTA PARA ALINEACIÓN' })).toBeInTheDocument()
  })

  it('reaparece al recibir el evento de reapertura de su key', () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()))
    render(<InfoCard />)

    expect(screen.queryByRole('heading', { name: 'CONSULTA PARA ALINEACIÓN' })).not.toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new CustomEvent('dismissible-notice:reopen:aligment-info'))
    })

    expect(screen.getByRole('heading', { name: 'CONSULTA PARA ALINEACIÓN' })).toBeInTheDocument()
  })
})
