/**
 * Applies the credential transformation policy selected at composition before
 * persistence. The policy may be pass-through or cryptographic; failures from
 * the configured transformation propagate to the caller.
 */
export interface CredentialEncryptor {
  encrypt(value: string): string
}
