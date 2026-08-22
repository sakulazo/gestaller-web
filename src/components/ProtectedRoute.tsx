// Ruta protegida: redirige al login si no hay token.

import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
