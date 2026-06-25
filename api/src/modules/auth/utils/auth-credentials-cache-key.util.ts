export function buildAuthCredentialsCacheKey(userId: number, sessionId: string): string {
  return `auth:credentials:${userId}:${sessionId}`
}
