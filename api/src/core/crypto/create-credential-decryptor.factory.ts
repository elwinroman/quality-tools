import { CredentialDecryptor } from '@shared/domain/credential-decryptor'

import { NODE_ENV } from '@/config/enviroment'
import { MODE } from '@/constants/commons'

import { CryptocodeCredentialDecryptor } from './cryptocode-credential-decryptor.adapter'
import { PlainCredentialDecryptor } from './plain-credential-decryptor.adapter'

/**
 * Selecciona el decryptor de credenciales según el entorno.
 *
 * Este es el único punto donde se lee `NODE_ENV` para esa decisión: en
 * desarrollo las credenciales viajan en texto plano, en el resto de entornos
 * están encriptadas. Los composition roots lo usan para inyectar la
 * implementación correcta en lugar de dejar la decisión dentro de la lógica.
 */
export function createCredentialDecryptor(): CredentialDecryptor {
  return NODE_ENV === MODE.development ? new PlainCredentialDecryptor() : new CryptocodeCredentialDecryptor()
}
