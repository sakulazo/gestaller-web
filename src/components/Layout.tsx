// Layout principal con barra lateral de navegación agrupada por funcionalidad.

import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface NavItem {
  to: string
  label: string
  end?: boolean
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    items: [{ to: '/', label: 'Dashboard', end: true }],
  },
  {
    title: 'Taller',
    items: [
      { to: '/work-orders', label: 'Órdenes de trabajo' },
      { to: '/clients', label: 'Clientes' },
      { to: '/vehicles', label: 'Vehículos' },
    ],
  },
  {
    title: 'Comercial',
    items: [
      { to: '/quotes', label: 'Presupuestos' },
      { to: '/invoices', label: 'Facturas' },
      { to: '/providers', label: 'Proveedores' },
    ],
  },
  {
    title: 'Catálogo',
    items: [
      { to: '/services', label: 'Servicios' },
      { to: '/products', label: 'Productos' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { to: '/users', label: 'Usuarios' },
      { to: '/company-profile', label: 'Datos del taller' },
      { to: '/tax-rates', label: 'Tasas de IVA' },
      { to: '/settings', label: 'Ajustes' },
      { to: '/reports', label: 'Reportes' },
      { to: '/data', label: 'Datos' },
    ],
  },
]

export default function Layout() {
  const { user, logout, can, getPermissionsForRoute } = useAuth()
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState<string[]>([])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    )
  }

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const perms = getPermissionsForRoute(item.to)
        return perms.length === 0 || perms.some(can)
      }),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="flex w-56 flex-col bg-slate-900 text-slate-100">
        <div className="px-4 py-5 text-lg font-bold">Gestaller</div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-2">
          {visibleSections.map((section, i) => {
            const open = !section.title || openSections.includes(section.title)
            return (
              <div key={section.title ?? i}>
                {section.title ? (
                  <button
                    onClick={() => toggleSection(section.title!)}
                    className="flex w-full items-center justify-between rounded px-3 pb-1 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
                  >
                    {section.title}
                    <span className="text-slate-600">{open ? '−' : '+'}</span>
                  </button>
                ) : null}
                {open &&
                  section.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `block rounded px-3 py-2 text-sm ${
                          isActive
                            ? 'bg-slate-700 text-white'
                            : 'text-slate-300 hover:bg-slate-800'
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
              </div>
            )
          })}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <p className="truncate text-sm">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="mt-2 text-xs text-slate-400 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
