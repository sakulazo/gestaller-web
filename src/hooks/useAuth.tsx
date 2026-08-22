// Contexto de autenticación: token JWT, usuario actual y catálogo de permisos.

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
  const [catalog, setCatalog] = useState<PermissionCatalog | null>(null)
  const [catalogReady, setCatalogReady] = useState(false)

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
    setCatalog(null)
    setCatalogReady(false)
  }, [])

  useEffect(() => {
    if (!token) {
      setCatalog(null)
      setCatalogReady(false)
      return
    }
    let cancelled = false
    fetchPermissionCatalog()
      .then((data) => {
        if (cancelled) return
        setCatalog(data)
        setCatalogReady(true)
      })
      .catch(() => {
        // Sin catálogo no hay permisos: se decide con catalogReady=true.
        if (!cancelled) setCatalogReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token) return
    const refresh = () => {
      authService
        .fetchMe()
        .then((me) => {
          localStorage.setItem(USER_KEY, JSON.stringify(me))
          setUser(me)
        })
        .catch(() => {})
    }
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [token])

  const can = useCallback(
    (permission: string) => user?.permissions?.includes(permission) ?? false,
    [user],
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
    () => ({ user, token, login, logout, can, catalog, catalogReady, getPermissionsForRoute, getModules }),
    [user, token, login, logout, can, catalog, catalogReady, getPermissionsForRoute, getModules],
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
