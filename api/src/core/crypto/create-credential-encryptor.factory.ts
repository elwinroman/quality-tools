import { CredentialEncryptor } from '@shared/domain/credential-encryptor'

import { NODE_ENV } from '@/config/enviroment'
import { MODE } from '@/constants/commons'

import { CryptocodeCredentialEncryptor } from './cryptocode-credential-encryptor.adapter'
import { PlainCredentialEncryptor } from './plain-credential-encryptor.adapter'

export function createCredentialEncryptor(): CredentialEncryptor {
  return NODE_ENV === MODE.development ? new PlainCredentialEncryptor() : new CryptocodeCredentialEncryptor()
}
