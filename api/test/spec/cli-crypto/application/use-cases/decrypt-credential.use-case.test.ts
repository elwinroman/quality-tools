import { describe, expect, it } from 'vitest'

import { DecryptCredentialUseCase } from '@/modules/cli-crypto/application/use-cases/decrypt-credential.use-case'
import { ForCryptoPort } from '@/modules/cli-crypto/domain/ports/drivens/for-crypto.port'

function createFakeCryptoService(overrides: Partial<ForCryptoPort> = {}) {
  const decrypted: string[] = []

  const service: ForCryptoPort = {
    encrypt: () => '',
    decrypt: encryptedText => {
      decrypted.push(encryptedText)
      return 'plano'
    },
    ...overrides,
  }

  return { service, decrypted }
}

describe('DecryptCredentialUseCase', () => {
  describe('texto cifrado válido', () => {
    it('debería delegar el texto cifrado al servicio y devolver el plano', () => {
      const { service, decrypted } = createFakeCryptoService()
      const useCase = new DecryptCredentialUseCase(service)

      expect(useCase.execute('cifrado')).toBe('plano')
      expect(decrypted).toEqual(['cifrado'])
    })

    it('debería devolver cadena vacía cuando el servicio desencripta a vacío', () => {
      const { service } = createFakeCryptoService({ decrypt: () => '' })
      const useCase = new DecryptCredentialUseCase(service)

      expect(useCase.execute('cifrado')).toBe('')
    })
  })

  describe('texto inválido', () => {
    it('debería lanzar Error y no delegar cuando el texto está vacío', () => {
      const { service, decrypted } = createFakeCryptoService()
      const useCase = new DecryptCredentialUseCase(service)

      expect(() => useCase.execute('')).toThrow('El texto a desencriptar no puede estar vacío')
      expect(decrypted).toHaveLength(0)
    })

    it('debería lanzar Error y no delegar cuando el texto es solo espacios', () => {
      const { service, decrypted } = createFakeCryptoService()
      const useCase = new DecryptCredentialUseCase(service)

      expect(() => useCase.execute('   ')).toThrow('El texto a desencriptar no puede estar vacío')
      expect(decrypted).toHaveLength(0)
    })
  })

  describe('fallo del servicio de cifrado', () => {
    it('debería lanzar Error cuando el servicio devuelve undefined', () => {
      const { service } = createFakeCryptoService({ decrypt: () => undefined })
      const useCase = new DecryptCredentialUseCase(service)

      expect(() => useCase.execute('cifrado')).toThrow('No se pudo desencriptar el texto')
    })
  })
})
