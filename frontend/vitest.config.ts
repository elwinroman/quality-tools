import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { defineConfig } from 'vitest/config'

// Vitest does not merge vite.config.ts when this file exists, so every alias
// must stay in sync with frontend/vite.config.ts.
export default defineConfig({
  plugins: [react()],
  envDir: '../',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@aligment': path.resolve(__dirname, './src/pages/Aligment'),
      '@sqldefinition': path.resolve(__dirname, './src/pages/SQLDefinition'),
      '~': path.resolve(__dirname, './'),
    },
  },
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
