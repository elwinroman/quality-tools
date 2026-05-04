import { useAppStore } from '@/zustand'

import { CircleLoader } from './circle-loader/CircleLoader'

export function DatabaseSwitchOverlay() {
  const switchingDatabase = useAppStore((state) => state.switchingDatabase)

  if (!switchingDatabase) return null

  return (
    <div
      className="bg-background/95 fixed inset-x-0 top-[var(--navbar-height)] bottom-0 z-[9999] flex items-center justify-center"
      aria-label="Cambiando base de datos"
    >
      <span className="text-primary relative h-7 w-7">
        <CircleLoader visible size={28} color="currentColor" />
      </span>
    </div>
  )
}
