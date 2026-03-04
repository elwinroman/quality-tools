import CryptoCode from '@core/utils/cryptocode.util'

import type { ForCryptoPort } from '../../../domain/ports'

/**
 * Adapter para el servicio de criptografía usando CryptoCode
 * Implementa el puerto ForCryptoPort
 */
export class CryptoCodeAdapter implements ForCryptoPort {
  encrypt(plainText: string): string {
    return CryptoCode.encrypt(plainText)
  }

  decrypt(encryptedText: string): string | undefined {
    return CryptoCode.decrypt(encryptedText)
  }
}
