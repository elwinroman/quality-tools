import cryptocodeUtil from '@core/utils/cryptocode.util'
import { CredentialDecryptor } from '@shared/domain/credential-decryptor'

/**
 * Implementación para entornos donde las credenciales se guardan encriptadas.
 * Es la única que conoce la `PASS_PHRASE` (vía `cryptocode.util`).
 */
export class CryptocodeCredentialDecryptor implements CredentialDecryptor {
  decrypt(value: string): string {
    return cryptocodeUtil.decrypt(value)
  }
}
