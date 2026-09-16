// Contexto de autenticación: token JWT, usuario actual y catálogo de permisos.

import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { PermissionCatalog, PermissionModule, User } from '../types'
import * as authService from '../services/auth'
import { fetchPermissionCatalog } from '../services'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  can: (permission: string) => boolean
  catalog: PermissionCatalog | null
  /** true cuando el catálogo terminó de cargar (con datos o con error). */
  catalogReady: boolean
  getPermissionsForRoute: (route: string) => string[]
  getModules: () => PermissionModule[]
}

const AuthContext = createContext<AuthContextValue | null>(null)

const TOKEN_KEY = 'gestaller_token'
const USER_KEY = 'gestaller_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY),
  )
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as User
    } catch {
      return null
    }
  })
  const queryClient = useQueryClient()

  const login = useCallback(async (username: string, password: string) => {
    const res = await authService.login(username, password)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    const me = await authService.fetchMe()
    localStorage.setItem(USER_KEY, JSON.stringify(me))
    setToken(res.access_token)
    setUser(me)
  }, [])

  const logout = useCallback(() => {
    authService.logoutRequest()
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
    queryClient.removeQueries({ queryKey: ['permissions-catalog'] })
    queryClient.removeQueries({ queryKey: ['auth-me'] })
  }, [queryClient])

  // Catálogo de permisos vía React Query: configuración estática que se
  // beneficia de caché, isPending/isError y del toast global de error.
  const catalogQuery = useQuery<PermissionCatalog, Error, PermissionCatalog>({
    queryKey: ['permissions-catalog'],
    queryFn: fetchPermissionCatalog,
    enabled: !!token,
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
    retry: false,
  })
  const catalog = catalogQuery.data ?? null
  const catalogReady = !catalogQuery.isPending

  // Sesión actual (/auth/me): el user sale de localStorage al arrancar
  // (bootstrap síncrono) y esta query lo refresca al volver a la ventana.
  // En error devuelve null sin lanzar (no hay toast espurio): la expiración
  // real de sesión la gestiona el interceptor de api.ts (refresh + redirect).
  const meQuery = useQuery<User | null, Error, User | null>({
    queryKey: ['auth-me'],
    queryFn: async () => {
      try {
        return await authService.fetchMe()
      } catch {
        return null
      }
    },
    enabled: !!token,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  })
  // Persiste el usuario refrescado (p. ej. al volver a la ventana) en
  // localStorage para el bootstrap síncrono del siguiente arranque.
  useEffect(() => {
    if (meQuery.data) {
      localStorage.setItem(USER_KEY, JSON.stringify(meQuery.data))
    }
  }, [meQuery.data])
  const activeUser = meQuery.data ?? user

  const can = useCallback(
    (permission: string) => activeUser?.permissions?.includes(permission) ?? false,
    [activeUser],
  )

  const getPermissionsForRoute = useCallback(
    (route: string) => catalog?.route_permissions[route] ?? [],
    [catalog],
  )

  const getModules = useCallback(
    () => catalog?.modules ?? [],
    [catalog],
  )

  const value = useMemo(
    () => ({ user: activeUser, token, login, logout, can, catalog, catalogReady, getPermissionsForRoute, getModules }),
    [activeUser, token, login, logout, can, catalog, catalogReady, getPermissionsForRoute, getModules],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}
