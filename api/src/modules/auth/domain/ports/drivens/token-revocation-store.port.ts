export interface RevocableToken {
  jti: string
  type: string
  userId: number
}

/**
 * Es responsable de la semántica de revocación de tokens, con independencia de
 * la tecnología de persistencia.
 *
 * Las revocaciones siguen vigentes durante el tiempo de vida restante
 * proporcionado del token. El store debe preservar los metadatos de identidad
 * del token por compatibilidad operativa, tratar cualquier marcador persistido
 * como revocado y propagar los fallos de persistencia.
 */
export interface TokenRevocationStore {
  isRevoked(jti: string): Promise<boolean>
  revoke(token: RevocableToken, expiresInSeconds: number): Promise<void>
}
