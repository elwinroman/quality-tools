/**
 * Constantes del DiffEditor que compara el objeto local (base actual) contra el
 * objeto de produccion.
 *
 * El color dentro del diff ya codifica "agregado/eliminado"; por eso estos
 * valores describen solo la identidad de entorno del chrome de cada panel.
 */

/** Etiqueta del panel de referencia: objeto tal como esta en produccion. */
export const DIFF_PANEL_PRODUCTION_LABEL = 'BD Producción:'

/** Etiqueta del panel local: objeto tal como esta en la base actual. */
export const DIFF_PANEL_LOCAL_LABEL = 'BD Pruebas:'

/** Aviso del badge de produccion: ese panel es la referencia y no se edita. */
export const DIFF_PANEL_READ_ONLY_HINT = 'Solo lectura'

/** Badge corto del panel de produccion. */
export const DIFF_PANEL_PRODUCTION_BADGE = 'PROD'

/** Badge corto del panel local. */
export const DIFF_PANEL_LOCAL_BADGE = 'LOCAL'

/** Identificador visual de entorno de cada panel del diff. */
export const DIFF_PANEL_TONE = {
  production: 'production',
  local: 'local',
} as const

export type DiffPanelTone = (typeof DIFF_PANEL_TONE)[keyof typeof DIFF_PANEL_TONE]

/** Selectores de Monaco donde se inyecta el header de cada panel. */
export const DIFF_PANEL_SELECTOR = {
  production: '.side-by-side .editor.original',
  local: '.side-by-side .editor.modified',
} as const
