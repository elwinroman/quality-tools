import { describe, expect, it } from 'vitest'

import { EncryptCredentialUseCase } from '@/modules/cli-crypto/application/use-cases/encrypt-credential.use-case'
import { ForCryptoPort } from '@/modules/cli-crypto/domain/ports/drivens/for-crypto.port'

function createFakeCryptoService(overrides: Partial<ForCryptoPort> = {}) {
  const encrypted: string[] = []

  const service: ForCryptoPort = {
    encrypt: plainText => {
      encrypted.push(plainText)
      return `cifrado:${plainText}`
    },
    decrypt: () => undefined,
    ...overrides,
  }

  return { service, encrypted }
}

describe('EncryptCredentialUseCase', () => {
  describe('texto válido', () => {
    it('debería delegar el texto plano al servicio y devolver el cifrado', () => {
      const { service, encrypted } = createFakeCryptoService()
      const useCase = new EncryptCredentialUseCase(service)

      expect(useCase.execute('secreto')).toBe('cifrado:secreto')
      expect(encrypted).toEqual(['secreto'])
    })

    it('debería preservar los espacios externos del texto delegado', () => {
      const { service, encrypted } = createFakeCryptoService()
      const useCase = new EncryptCredentialUseCase(service)

      expect(useCase.execute('  secreto  ')).toBe('cifrado:  secreto  ')
      expect(encrypted).toEqual(['  secreto  '])
    })
  })

  describe('texto inválido', () => {
    it('debería lanzar Error y no delegar cuando el texto está vacío', () => {
      const { service, encrypted } = createFakeCryptoService()
      const useCase = new EncryptCredentialUseCase(service)

      expect(() => useCase.execute('')).toThrow('El texto a encriptar no puede estar vacío')
      expect(encrypted).toHaveLength(0)
    })

    it('debería lanzar Error y no delegar cuando el texto es solo espacios', () => {
      const { service, encrypted } = createFakeCryptoService()
      const useCase = new EncryptCredentialUseCase(service)

      expect(() => useCase.execute('   ')).toThrow('El texto a encriptar no puede estar vacío')
      expect(encrypted).toHaveLength(0)
    })
  })
})
