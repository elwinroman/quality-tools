import { DecryptionException } from '@core/exceptions'
import CryptoCode from '@core/utils/cryptocode.util'
import { describe, expect, it } from 'vitest'

describe('CryptoCode', () => {
  const messages = [
    'uMonitor', // texto simple en minúsculas y mayúsculas
    ' password separado ', // texto con espacios al inicio y final
    'paswordConAcentosYTíldes', // texto con caracteres con tilde/acentos
    '1234567890', // solo números
    'Texto_con_guiones-bajos-y-medios', // texto con guiones bajos y medios
    'Texto!@#$%^&*()_+{}[]<>?', // texto con símbolos especiales
    'Texto\ncon\nsaltos\nde\nlínea', // texto con saltos de línea
    'Texto\tcon\ttabulaciones', // texto con tabulaciones
    '', // cadena vacía (password - sql server)
    '🧪🔐🚀🌐🎉', // emojis y caracteres unicode
    'áéíóúÁÉÍÓÚñÑçÇ', // caracteres del español extendido
    '漢字かなカナ', // caracteres japoneses (Unicode multibyte)
    'long'.repeat(1000), // texto muy largo (para estrés)
  ]

  it('debe cifrar y descifrar correctamente', () => {
    messages.forEach(content => {
      const encrypted = CryptoCode.encrypt(content)
      const decrypted = CryptoCode.decrypt(encrypted)
      expect(decrypted).toBe(content) // verifica que el texto descifrado es el mismo que el original
    })
  })

  it('debería generar cifrados distintos para el mismo contenido', () => {
    const content = 'credencial-secreta'
    const firstEncrypted = CryptoCode.encrypt(content)
    const secondEncrypted = CryptoCode.encrypt(content)

    expect(firstEncrypted).not.toBe(secondEncrypted)
    expect(CryptoCode.decrypt(firstEncrypted)).toBe(content)
    expect(CryptoCode.decrypt(secondEncrypted)).toBe(content)
  })

  it('debería devolver un string encriptado con separadores "*"', () => {
    // la cadena vacía se cifra y descifra, pero su ciphertext es '' y por eso no
    // puede cumplir que las 4 partes tengan contenido; se excluye a propósito.
    messages
      .filter(content => content !== '')
      .forEach(content => {
        const encrypted = CryptoCode.encrypt(content)
        const parts = encrypted.split('*')

        // asegura que hay 4 partes: texto, salt, iv, tag
        expect(parts.length).toBe(4)
        parts.forEach(part => {
          expect(typeof part).toBe('string')
          expect(part.length).toBeGreaterThan(0)
        })
      })

    const emptyParts = CryptoCode.encrypt('').split('*')

    expect(emptyParts).toHaveLength(4)
    expect(emptyParts[0]).toBe('')
    emptyParts.slice(1).forEach(part => expect(part.length).toBeGreaterThan(0))
  })

  it('debería lanzar DecryptionException sin exponer el string malformado', () => {
    const fakeEncrypted = 'mal*formado*texto'
    let thrown: unknown

    try {
      CryptoCode.decrypt(fakeEncrypted)
    } catch (error) {
      thrown = error
    }

    expect(thrown).toBeInstanceOf(DecryptionException)
    if (!(thrown instanceof DecryptionException)) throw thrown

    expect(thrown.message).not.toContain(fakeEncrypted)
    expect(thrown.detail).not.toContain(fakeEncrypted)
  })

  it('debería lanzar DecryptionException si el contenido es alterado', () => {
    messages.forEach(content => {
      const encrypted = CryptoCode.encrypt(content)
      const parts = encrypted.split('*')

      // manipula IV para invalidar el cifrado
      parts[2] = Buffer.from('invalidoiv123456').toString('base64')
      const tampered = parts.join('*')

      expect(() => {
        CryptoCode.decrypt(tampered)
      }).toThrow(DecryptionException)
    })
  })
})
