// Dashboard con indicadores según los permisos del usuario.

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { getActivity, getDashboard } from '../services'
import type { DashboardReport } from '../types'

interface CardDef {
  key: keyof DashboardReport
  label: string
  currency?: boolean
  perm: string
}

const cards: CardDef[] = [
  { key: 'clients', label: 'Clientes', perm: 'clients.view' },
  { key: 'vehicles', label: 'Vehículos', perm: 'vehicles.view' },
  { key: 'open_orders', label: 'Órdenes abiertas', perm: 'work_orders.view' },
  { key: 'monthly_revenue', label: 'Facturación del mes', currency: true, perm: 'invoices.view' },
]

export default function Dashboard() {
  const { can } = useAuth()
  const visibleCards = cards.filter((c) => can(c.perm))
  const hasCards = visibleCards.length > 0
  const hasActivity = can('work_orders.view')

  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    enabled: hasCards,
  })
  const actividad = useQuery({
    queryKey: ['actividad'],
    queryFn: getActivity,
    enabled: hasActivity,
  })

  if (!hasCards && !hasActivity) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500">Sin permisos para mostrar indicadores</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-800">Dashboard</h1>

      {hasCards && dashboard.isLoading && <p className="text-slate-500">Cargando…</p>}
      {hasCards && dashboard.isError && (
        <p className="text-red-600">No se pudieron cargar los indicadores</p>
      )}

      {hasCards && dashboard.data && (
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {visibleCards.map((c) => (
            <div key={c.key} className="rounded bg-white p-4 shadow">
              <p className="text-sm text-slate-500">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-800">
                {c.currency
                  ? `${Number(dashboard.data?.[c.key] ?? 0).toFixed(2)} €`
                  : dashboard.data?.[c.key] ?? '—'}
              </p>
            </div>
          ))}
        </div>
      )}

      {hasActivity && (
        <>
          <h2 className="mb-3 text-lg font-semibold text-slate-700">
            Órdenes por estado
          </h2>
          <div className="rounded bg-white p-4 shadow">
            {actividad.data?.length ? (
              <ul className="space-y-2">
                {actividad.data.map((a) => (
                  <li key={a.status} className="flex justify-between text-sm">
                    <span className="text-slate-600">{a.status}</span>
                    <span className="font-semibold">{a.quantity}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-400">Sin actividad registrada</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
