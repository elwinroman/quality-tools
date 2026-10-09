import { useAppStore } from '@/zustand'

import { CircleLoader } from './circle-loader/CircleLoader'

/**
 * `CircleLoader` con el color resuelto por el modo de la app.
 *
 * Evita repetir `color={isDark ? 'white' : 'black'}` en cada consumidor: la
 * apariencia sigue siendo exactamente la misma.
 */
interface Props {
  size?: number
}

export function ThemedCircleLoader({ size }: Props) {
  const isDark = useAppStore((state) => state.isDark)

  return <CircleLoader visible size={size} color={isDark ? 'white' : 'black'} />
}
