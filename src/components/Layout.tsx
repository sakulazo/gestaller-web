// Layout principal con barra lateral de navegación agrupada por funcionalidad.

import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  Building,
  Boxes,
  Car,
  ChartColumn,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  Hammer,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  ReceiptEuro,
  Settings,
  ShieldCheck,
  Truck,
  UserCog,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import Brand from './Brand'

interface NavItem {
  to: string
  label: string
  end?: boolean
  icon: LucideIcon
}

interface NavSection {
  title?: string
  icon?: LucideIcon
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    items: [{ to: '/', label: 'Dashboard', end: true, icon: LayoutDashboard }],
  },
  {
    title: 'Taller',
    icon: Hammer,
    items: [
      { to: '/work-orders', label: 'Órdenes de trabajo', icon: ClipboardList },
      { to: '/clients', label: 'Clientes', icon: Users },
      { to: '/vehicles', label: 'Vehículos', icon: Car },
    ],
  },
  {
    title: 'Comercial',
    icon: HandCoins,
    items: [
      { to: '/quotes', label: 'Presupuestos', icon: FileText },
      { to: '/invoices', label: 'Facturas', icon: ReceiptEuro },
      { to: '/providers', label: 'Proveedores', icon: Truck },
    ],
  },
  {
    title: 'Catálogo',
    icon: Boxes,
    items: [
      { to: '/services', label: 'Servicios', icon: Wrench },
      { to: '/products', label: 'Productos', icon: Package },
    ],
  },
  {
    title: 'Administración',
    icon: ShieldCheck,
    items: [
      { to: '/users', label: 'Usuarios', icon: UserCog },
      { to: '/company-profile', label: 'Datos del taller', icon: Building },
      { to: '/tax-rates', label: 'Tasas de IVA', icon: Percent },
      { to: '/settings', label: 'Ajustes', icon: Settings },
      { to: '/reports', label: 'Reportes', icon: ChartColumn },
    ],
  },
]

export default function Layout() {
  const { user, logout, can, getPermissionsForRoute } = useAuth()
  const navigate = useNavigate()
  const [openSections, setOpenSections] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openSection, setOpenSection] = useState<{
    title: string
    source: 'hover' | 'click' | 'focus'
  } | null>(null)
  const tabletNavRef = useRef<HTMLDivElement>(null)
  const triggerPointerRef = useRef<string | null>(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  useEffect(() => {
    if (openSection === null) return
    const onPointerDown = (e: PointerEvent) => {
      if (tabletNavRef.current && !tabletNavRef.current.contains(e.target as Node)) {
        setOpenSection(null)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openSection])

  const isSectionOpen = (title: string) => openSection?.title === title

  const openFromHover = (title: string) => setOpenSection({ title, source: 'hover' })

  const closeFromHover = () =>
    setOpenSection((prev) => (prev?.source === 'hover' ? null : prev))

  const toggleFromClick = (title: string) =>
    setOpenSection((prev) =>
      prev?.title === title ? null : { title, source: 'click' },
    )

  const openFromFocus = (title: string) => setOpenSection({ title, source: 'focus' })

  const closeFromFocus = (e: React.FocusEvent<HTMLDivElement>, title: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return
    setOpenSection((prev) =>
      prev?.title === title && prev.source === 'focus' ? null : prev,
    )
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

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded px-3 py-2 text-sm ${
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
          setOpenSection(null)
          setOpenSections([])
        }}
      >
        <item.icon className="h-4 w-4 shrink-0 opacity-70" />
        <span className="truncate">{item.label}</span>
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
                aria-expanded={open}
                className="flex w-full items-center justify-between rounded px-3 pb-1 pt-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300"
              >
                <span className="flex items-center gap-3">
                  {section.icon && (
                    <section.icon className="h-4 w-4 shrink-0 opacity-70" />
                  )}
                  {section.title}
                </span>
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
          <Brand
            withWordmark
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg"
          />
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
          {visibleSections.map((section) => {
            if (section.title) {
              const open = isSectionOpen(section.title)
              return (
                <div
                  key={section.title}
                  className="relative"
                  onPointerEnter={(e) => {
                    if (e.pointerType === 'mouse') openFromHover(section.title!)
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === 'mouse') closeFromHover()
                  }}
                  onFocus={() => openFromFocus(section.title!)}
                  onBlur={(e) => closeFromFocus(e, section.title!)}
                >
                  <button
                    onPointerDown={(e) => {
                      triggerPointerRef.current = e.pointerType
                    }}
                    onClick={(e) => {
                      // Con ratón el hover ya gobierna el submenú: el click no lo cerraría.
                      if (e.detail > 0 && triggerPointerRef.current === 'mouse') return
                      toggleFromClick(section.title!)
                    }}
                    aria-expanded={open}
                    className={`flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm ${
                      open
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {section.icon && (
                      <section.icon className="h-4 w-4 shrink-0 opacity-70" />
                    )}
                    {section.title}
                    <span className="text-slate-500">
                      {open ? (
                        <ChevronUp className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </span>
                  </button>
                  {open && (
                    <div className="absolute left-0 top-full z-10 pt-1">
                      <div className="animate-fade-in w-max min-w-48 rounded-md border border-slate-700 bg-slate-900 py-2 shadow-xl">
                        {renderLinks(section.items)}
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            const { icon: Icon, to, end, label } = section.items[0]
            return (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setOpenSection(null)}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded px-3 py-2 text-sm ${
                    isActive
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0 opacity-70" />
                {label}
              </NavLink>
            )
          })}
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
              <Brand withWordmark className="flex-1 text-lg" />
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