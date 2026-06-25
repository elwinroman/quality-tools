export interface AccessTokenPayload {
  user_id: number
  username: string
  session_id: string
  role: string
  type: string
  jti: string
}

export type AccessTokenDecoded = AccessTokenPayload & { expirationCountdown: number }

export interface RefreshTokenPayload {
  user_id: number
  username: string
  session_id: string
  type: string
  jti: string
}

export type RefreshTokenDecoded = RefreshTokenPayload & { expirationCountdown: number }

export interface NewTokens {
  accessToken: string
  refreshToken: string
}

export const TokenTypeEnum = {
  Access: 'access_token',
  Refresh: 'refresh_token',
} as const

export type TokenType = keyof typeof TokenTypeEnum

export interface ForTokenManagementPort {
  createAccessToken(id: number, username: string, sessionId: string): string
  createRefreshToken(id: number, username: string, sessionId: string): string
  verifyAccessToken(accessToken: string): AccessTokenDecoded
  verifyRefreshToken(refreshToken: string): RefreshTokenDecoded
  checkIfUserIsAlreadyAuthenticated(accessToken: string): boolean
}
