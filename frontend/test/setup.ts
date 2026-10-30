import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// globals are disabled, so Testing Library's auto-cleanup never registers.
// Reset the DOM and browser storage explicitly to keep tests atomic.
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})
