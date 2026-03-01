import { Toaster as Sonner } from 'sonner'

import { TOAST_STYLE } from '@/enviroment/enviroment'

// Estilos base compartidos por ambos modos
const TOAST_BASE = [
  // Layout
  'group toast !p-2 !px-3 !w-[420px]',
  // Forma
  '!rounded-sm shadow-lg border',
  // Icono
  '[&>[data-icon]]:!self-start [&>[data-icon]]:!mt-1',
].join(' ')

const TITLE_BASE = 'text-sm font-semibold'
const DESCRIPTION_BASE = 'text-xs opacity-80 !font-medium'

// Modo colorido: cada tipo de toast tiene su color
const colorfulClassNames = {
  success: '!bg-palette-success-darker !border-palette-success-dark !text-palette-success-contrastText',
  error: '!bg-destructive !border-red-700 !text-destructive-foreground',
  info: '!bg-palette-primary-dark !border-palette-primary-darker !text-white',
  warning: '!bg-amber-600 !border-amber-700 !text-white',
}

// Modo minimalista: usa los colores base de la app (--background / --foreground)
const minimalClassNames = {
  toast: `${TOAST_BASE} !bg-foreground !text-background !border-border`,
}

const Toaster = () => {
  return (
    <Sonner
      position="bottom-right"
      style={{ '--offset': '24px', right: '100px' } as React.CSSProperties}
      className="toaster group"
      toastOptions={{
        classNames: {
          ...(TOAST_STYLE === 'minimal' ? minimalClassNames : { toast: TOAST_BASE, ...colorfulClassNames }),
          title: TITLE_BASE,
          description: DESCRIPTION_BASE,
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
    />
  )
}

export { Toaster }
