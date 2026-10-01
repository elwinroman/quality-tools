import { ValkeyCacheRepository } from '@core/cache/valkey-cache-repository'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// El cliente real de iovalkey importa `@/config/enviroment` (que puede llamar a process.exit(1))
// y abre una conexión de red. Se reemplaza para fijar el contrato de comandos del repositorio:
// comando, argumentos y posición de la opción EX.
const { client } = vi.hoisted(() => ({
  client: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    ttl: vi.fn(),
    keys: vi.fn(),
  },
}))

vi.mock('@core/cache/valkey-client', () => ({ valkeyClient: client }))

describe('ValkeyCacheRepository', () => {
  const repository = new ValkeyCacheRepository()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('set', () => {
    it('debería enviar el valor y el TTL con la opción EX en el orden que espera el cliente', async () => {
      await repository.set('session:1', 'valor', 900)

      expect(client.set).toHaveBeenCalledTimes(1)
      expect(client.set).toHaveBeenCalledWith('session:1', 'valor', 'EX', 900)
    })

    it('debería usar el TTL por defecto de 3600 cuando no se indica', async () => {
      await repository.set('session:1', 'valor')

      expect(client.set).toHaveBeenCalledTimes(1)
      expect(client.set).toHaveBeenCalledWith('session:1', 'valor', 'EX', 3600)
    })
  })

  describe('get', () => {
    it('debería devolver el valor entregado por el cliente', async () => {
      client.get.mockResolvedValueOnce('valor')

      await expect(repository.get('session:1')).resolves.toBe('valor')
      expect(client.get).toHaveBeenCalledTimes(1)
      expect(client.get).toHaveBeenCalledWith('session:1')
    })

    it('debería devolver null cuando la clave no existe', async () => {
      client.get.mockResolvedValueOnce(null)

      await expect(repository.get('ausente')).resolves.toBeNull()
    })
  })

  describe('delete', () => {
    it('debería eliminar la clave con el comando DEL', async () => {
      await repository.delete('session:1')

      expect(client.del).toHaveBeenCalledTimes(1)
      expect(client.del).toHaveBeenCalledWith('session:1')
    })
  })

  describe('ttl', () => {
    it('debería devolver el TTL restante entregado por el cliente', async () => {
      client.ttl.mockResolvedValueOnce(87)

      await expect(repository.ttl('session:1')).resolves.toBe(87)
      expect(client.ttl).toHaveBeenCalledTimes(1)
      expect(client.ttl).toHaveBeenCalledWith('session:1')
    })
  })

  describe('keys', () => {
    it('debería devolver las claves que coinciden con el patrón', async () => {
      client.keys.mockResolvedValueOnce(['prefijo:a', 'prefijo:b'])

      await expect(repository.keys('prefijo:*')).resolves.toEqual(['prefijo:a', 'prefijo:b'])
      expect(client.keys).toHaveBeenCalledTimes(1)
      expect(client.keys).toHaveBeenCalledWith('prefijo:*')
    })
  })
})
