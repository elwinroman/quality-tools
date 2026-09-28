/**
 * Applies the credential transformation policy selected at composition when
 * loading persisted values. The policy may be pass-through or cryptographic;
 * returned credentials remain sensitive, and configured transformation
 * failures propagate to the caller.
 */
export interface CredentialDecryptor {
  decrypt(value: string): string
}
