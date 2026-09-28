import cryptocodeUtil from '@core/utils/cryptocode.util'
import { CredentialEncryptor } from '@shared/domain/credential-encryptor'

export class CryptocodeCredentialEncryptor implements CredentialEncryptor {
  encrypt(value: string): string {
    return cryptocodeUtil.encrypt(value)
  }
}
