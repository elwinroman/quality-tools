/**
 * Low-level key/value gateway owned by infrastructure.
 *
 * This is NOT an application-facing port. Features must depend on their own
 * semantic ports (for example `SessionCredentialStore` or
 * `TokenRevocationStore`) instead of reaching for this generic storage
 * contract. Only infrastructure components and composition roots may depend
 * on it.
 */
export interface KeyValueStore {
  /** Almacena un valor en la caché con una clave específica y un tiempo de vida opcional (default: 3600s). */
  set(key: string, value: string, ttl?: number): Promise<void>

  /**
   * Reemplaza `value` solo si la clave sigue conteniendo exactamente `expected`.
   * Devuelve true si el reemplazo ocurrió; false si la clave no existe o cambió.
   * El TTL se (re)establece a `ttl` segundos solo en el éxito.
   *
   * Una clave inexistente o expirada también devuelve false: es la señal
   * intencional de conflicto, nunca un éxito silencioso.
   */
  compareAndSet(key: string, expected: string, value: string, ttl: number): Promise<boolean>

  /** Recupera un valor de la caché utilizando una clave específica. */
  get(key: string): Promise<string | null>

  /** Elimina un valor de la caché utilizando una clave específica. */
  delete(key: string): Promise<void>

  /** Retorna el tiempo de vida restante (en segundos) de una clave. -2 si no existe, -1 si no tiene TTL. */
  ttl(key: string): Promise<number>

  /** Lista las claves que coinciden con un patrón glob (por ejemplo `prefijo:*`). */
  keys(pattern: string): Promise<string[]>
}
