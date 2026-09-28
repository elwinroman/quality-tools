import { CredentialDecryptor } from '@shared/domain/credential-decryptor'

/**
 * Implementación para entornos donde las credenciales viajan en texto plano.
 * No hay nada que desencriptar, se devuelve el valor tal cual.
 */
export class PlainCredentialDecryptor implements CredentialDecryptor {
  decrypt(value: string): string {
    return value
  }
}
