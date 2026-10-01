/**
 * Aplica la política de transformación de credenciales seleccionada en la
 * composición al cargar valores persistidos. La política puede ser de paso
 * directo o criptográfica; las credenciales devueltas siguen siendo sensibles,
 * y los fallos de la transformación configurada se propagan al llamador.
 */
export interface CredentialDecryptor {
  decrypt(value: string): string
}
