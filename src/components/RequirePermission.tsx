// Ruta protegida por permiso: muestra 403 si el usuario no tiene ningún permiso del módulo.

import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import SinAcceso from '../pages/SinAcceso'

export default function RequirePermission({
  module,
  children,
}: {
  module: string
  children: ReactNode
}) {
  const { can, catalogReady, getPermissionsForRoute } = useAuth()
  // Mientras el catálogo de permisos carga no se renderiza nada: evita el
  // flash de contenido autorizado antes de poder evaluar el permiso.
  if (!catalogReady) {
    return <p className="p-8 text-sm text-slate-500">Cargando…</p>
  }
  const perms = getPermissionsForRoute(module)
  if (perms.length > 0 && !perms.some(can)) {
    return <SinAcceso />
  }
  return <>{children}</>
}
