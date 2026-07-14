import { AsyncLocalStorage } from 'node:async_hooks'

import { AuthContext } from '@auth/domain/schemas/auth-context'

const authContextStorage = new AsyncLocalStorage<AuthContext>()

export function setAuthContext(authContext: AuthContext) {
  authContextStorage.enterWith({ userId: authContext.userId, sessionId: authContext.sessionId })
}

export function getAuthContext(): AuthContext | undefined {
  const authContext = authContextStorage.getStore()

  return authContext
}
