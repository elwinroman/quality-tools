import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ContentTitle } from '@/components/shared'

describe('ContentTitle', () => {
  it('renderiza su contenido como el encabezado de la página', () => {
    render(<ContentTitle>Esquema</ContentTitle>)

    expect(screen.getByRole('heading', { level: 1, name: 'Esquema' })).toHaveClass('text-primary', 'text-xl', 'font-bold')
  })
})
