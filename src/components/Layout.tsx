// Layout principal con barra lateral de navegación agrupada por funcionalidad.

import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, LogOut, Menu, X } from 'lucide-react'
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
    ],
  },
]

export default function Layout() {
  const { user, logout, can, getPermissionsForRoute } = useAuth()
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [tabletOpen, setTabletOpen] = useState<string | null>(null)
  const tabletNavRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    if (tabletOpen === null) return
    const onPointerDown = (e: PointerEvent) => {
      if (tabletNavRef.current && !tabletNavRef.current.contains(e.target as Node)) {
        setTabletOpen(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [tabletOpen])

  const toggleSection = (title: string) => {
    setOpenSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    )
  }

  const toggleTabletSection = (title: string) => {
    setTabletOpen((prev) => (prev === title ? null : title))
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

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm ${
      isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'
    }`

  const renderLinks = (items: NavItem[]) =>
    items.map((item) => (
      <NavLink
        key={item.to}
        to={item.to}
        end={item.end}
        className={linkClass}
        onClick={() => {
          setMobileOpen(false)
          setTabletOpen(null)
          setOpenSections([])
        }}
      >
        {item.label}
      </NavLink>
    ))

  const renderSections = (navClass: string) => (
    <nav className={navClass}>
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
            {open && renderLinks(section.items)}
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="flex w-full bg-slate-900 text-slate-100">
        <div className="relative flex flex-1 items-center gap-3 px-4 py-3">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
            className="sm:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold">
            Gestaller
          </div>
          <div className="flex flex-1 items-center justify-end gap-3">
            <p className="hidden truncate text-sm sm:block">{user?.name}</p>
            <button
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <nav
        ref={tabletNavRef}
        className="relative hidden border-t border-slate-800 bg-slate-900 text-slate-100 sm:block"
      >
        <div className="flex flex-wrap items-center gap-1 px-3 py-2">
          {visibleSections.map((section) =>
            section.title ? (
              <div key={section.title} className="relative">
                <button
                  onClick={() => toggleTabletSection(section.title!)}
                  aria-expanded={tabletOpen === section.title}
                  className={`flex shrink-0 items-center gap-1 rounded px-3 py-2 text-sm ${
                    tabletOpen === section.title
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {section.title}
                  <span className="text-slate-500">
                    {tabletOpen === section.title ? (
                      <ChevronUp className="h-3 w-3" />
                    ) : (
                      <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </button>
                {tabletOpen === section.title && (
                  <div className="absolute left-0 top-full z-10 mt-1 w-max min-w-48 rounded-md border border-slate-700 bg-slate-900 py-2 shadow-xl">
                    {renderLinks(section.items)}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={section.items[0].to}
                to={section.items[0].to}
                end={section.items[0].end}
                onClick={() => setTabletOpen(null)}
                className={({ isActive }) =>
                  `shrink-0 rounded px-3 py-2 text-sm ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                {section.items[0].label}
              </NavLink>
            ),
          )}
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="animate-fade-in absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="animate-scale-in absolute inset-y-0 left-0 flex w-64 flex-col bg-slate-900 text-slate-100 shadow-xl">
            <div className="flex items-center gap-3 px-4 py-4">
              <div className="flex flex-1 text-lg font-bold">Gestaller</div>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Cerrar menú"
                className="text-slate-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {renderSections('flex-1 space-y-1 overflow-y-auto px-2')}
          </aside>
        </div>
      )}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}