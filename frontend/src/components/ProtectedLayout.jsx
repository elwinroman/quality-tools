import { Navigate } from 'react-router-dom'

import { useAuthStore } from '@/stores'

import { SessionExpiredAlert } from './SessionExpiredAlert'

export function ProtectedLayout({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isSessionExpired = useAuthStore((state) => state.isSessionExpired)
  const checkSession = useAuthStore((state) => state.checkSession)

  if (!isAuthenticated) return <Navigate to="/aligment" />
  checkSession()
  // console.log(isSessionExpired)
  return (
    <>
      {isSessionExpired && <SessionExpiredAlert></SessionExpiredAlert>}
      {children}
    </>
  )
}
