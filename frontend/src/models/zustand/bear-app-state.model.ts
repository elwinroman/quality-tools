/**
 * Estado global de configuración de la aplicación.
 *
 * Esta interfaz define los parámetros relacionados con el comportamiento visual
 * y funcional de la aplicación.
 *
 */
export interface BearAppState {
  /** Indica si el modo oscuro está activado, `true` para modo oscuro, `false` para modo claro. */
  isDark: boolean

  /** Base de datos en proceso de cambio. */
  switchingDatabase: string | null

  /** Actualiza el estado de `isDark`. */
  updateDark: (state: boolean) => void

  /** Actualiza la base de datos en proceso de cambio. */
  updateSwitchingDatabase: (database: string | null) => void
}
