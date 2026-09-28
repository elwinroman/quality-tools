import { CredentialEncryptor } from '@shared/domain/credential-encryptor'

export class PlainCredentialEncryptor implements CredentialEncryptor {
  encrypt(value: string): string {
    return value
  }
}
