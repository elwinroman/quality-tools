import { createCredentialDecryptor } from '@core/crypto/create-credential-decryptor.factory'
import { createCredentialEncryptor } from '@core/crypto/create-credential-encryptor.factory'
import { describe, expect, it, vi } from 'vitest'

const { environment } = vi.hoisted(() => ({ environment: { value: 'development' } }))

vi.mock('@/config/enviroment', () => ({
  get NODE_ENV() {
    return environment.value
  },
}))

vi.mock('@/constants/commons', () => ({ MODE: { development: 'development' } }))

vi.mock('@core/crypto/plain-credential-encryptor.adapter', () => ({
  PlainCredentialEncryptor: class {
    encrypt(value: string) {
      return `plain:${value}`
    }
  },
}))

vi.mock('@core/crypto/plain-credential-decryptor.adapter', () => ({
  PlainCredentialDecryptor: class {
    decrypt(value: string) {
      return `plain:${value}`
    }
  },
}))

vi.mock('@core/crypto/cryptocode-credential-encryptor.adapter', () => ({
  CryptocodeCredentialEncryptor: class {
    encrypt(value: string) {
      return `encrypted:${value}`
    }
  },
}))

vi.mock('@core/crypto/cryptocode-credential-decryptor.adapter', () => ({
  CryptocodeCredentialDecryptor: class {
    decrypt(value: string) {
      return `decrypted:${value}`
    }
  },
}))

describe('factorías de criptografía de credenciales', () => {
  it('debería seleccionar el cifrado y descifrado en texto plano en desarrollo', () => {
    environment.value = 'development'

    expect(createCredentialEncryptor().encrypt('credential')).toBe('plain:credential')
    expect(createCredentialDecryptor().decrypt('credential')).toBe('plain:credential')
  })

  it('debería seleccionar el cifrado y descifrado de Cryptocode fuera de desarrollo', () => {
    environment.value = 'production'

    expect(createCredentialEncryptor().encrypt('credential')).toBe('encrypted:credential')
    expect(createCredentialDecryptor().decrypt('credential')).toBe('decrypted:credential')
  })
})
