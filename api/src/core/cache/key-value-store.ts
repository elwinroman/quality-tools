/**
 * Pasarela clave/valor de bajo nivel, propiedad de la infraestructura.
 *
 * Este NO es un puerto orientado a la aplicación. Las funcionalidades deben
 * depender de sus propios puertos semánticos (por ejemplo
 * `SessionCredentialStore` o `TokenRevocationStore`) en lugar de recurrir a
 * este contrato de almacenamiento genérico. Solo los componentes de
 * infraestructura y las raíces de composición pueden depender de él.
 */
export interface KeyValueStore {
  /** Almacena un valor en la caché con una clave específica y un tiempo de vida opcional (default: 3600s). */
  set(key: string, value: string, ttl?: number): Promise<void>

  /**
   * Reemplaza `value` solo si la clave sigue conteniendo exactamente `expected`.
   * Devuelve true si el reemplazo ocurrió; false si la clave no existe o cambió.
   * El reemplazo conserva la expiración propia de la clave en el éxito.
   *
   * Una clave inexistente o expirada también devuelve false: es la señal
   * intencional de conflicto, nunca un éxito silencioso.
   */
  compareAndSet(key: string, expected: string, value: string): Promise<boolean>

  /** Recupera un valor de la caché utilizando una clave específica. */
  get(key: string): Promise<string | null>

  /** Elimina un valor de la caché utilizando una clave específica. */
  delete(key: string): Promise<void>

  /** Retorna el tiempo de vida restante (en segundos) de una clave. -2 si no existe, -1 si no tiene TTL. */
  ttl(key: string): Promise<number>

  /** Lista las claves que coinciden con un patrón glob (por ejemplo `prefijo:*`). */
  keys(pattern: string): Promise<string[]>
}
