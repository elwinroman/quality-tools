import { KeyValueStore } from './key-value-store'
import { valkeyClient } from './valkey-client'

/**
 * Repositorio de caché que utiliza Valkey (alternativa a Redis).
 * Implementa la interfaz `KeyValueStore` para gestionar operaciones de caché.
 */
export class ValkeyCacheRepository implements KeyValueStore {
  async set(key: string, value: string, ttl = 3600): Promise<void> {
    await valkeyClient.set(key, value, 'EX', ttl)
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
