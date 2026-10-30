/**
 * Aplica la política de transformación de credenciales seleccionada en la
 * composición antes de persistir. La política puede ser de paso directo o
 * criptográfica; los fallos de la transformación configurada se propagan al
 * llamador.
 */
export interface CredentialEncryptor {
  encrypt(value: string): string
}
