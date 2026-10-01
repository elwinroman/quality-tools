import { KeyValueStore } from './key-value-store'
import { valkeyClient } from './valkey-client'

/**
 * Reemplazo condicional atomico: GET -> comparar contra `ARGV[1]` -> SET con EX.
 *
 * La comparacion es byte a byte sobre el valor crudo (no sobre un campo del
 * JSON), porque el blob de credenciales se re-cifra con sal e IV aleatorios y
 * volver a serializar las mismas credenciales produce un valor distinto.
 * Una clave inexistente o expirada hace que la comparacion falle y devuelve 0.
 */
const COMPARE_AND_SET_SCRIPT = `
  local current = redis.call('GET', KEYS[1])
  if current == ARGV[1] then
    redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
    return 1
  end
  return 0
`

/**
 * Repositorio de caché que utiliza Valkey (alternativa a Redis).
 * Implementa la interfaz `KeyValueStore` para gestionar operaciones de caché.
 */
export class ValkeyCacheRepository implements KeyValueStore {
  async set(key: string, value: string, ttl = 3600): Promise<void> {
    await valkeyClient.set(key, value, 'EX', ttl)
  }

  async compareAndSet(key: string, expected: string, value: string, ttl: number): Promise<boolean> {
    const result = await valkeyClient.eval(COMPARE_AND_SET_SCRIPT, 1, key, expected, value, ttl)

    return result === 1
  }

  async get(key: string): Promise<string | null> {
    return await valkeyClient.get(key)
  }

  async delete(key: string): Promise<void> {
    await valkeyClient.del(key)
  }

  async ttl(key: string): Promise<number> {
    return await valkeyClient.ttl(key)
  }

  async keys(pattern: string): Promise<string[]> {
    return await valkeyClient.keys(pattern)
  }
}
