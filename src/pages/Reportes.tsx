// Reportes: facturación mensual y actividad.

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../hooks/useAuth'
import { getActivity, getMonthlyBilling } from '../services'

export default function Reportes() {
  const { can } = useAuth()
  const facturacion = useQuery({
    queryKey: ['reportes-facturacion'],
    queryFn: getMonthlyBilling,
  })
  const actividad = useQuery({
    queryKey: ['reportes-actividad'],
    queryFn: getActivity,
    enabled: can('work_orders.view'),
  })

  return (
    <div>
      <h1 className="mb-6 text-page-title font-bold text-slate-800">Reportes</h1>

      <h2 className="mb-3 text-lg font-semibold text-slate-700">
        Facturación mensual
      </h2>
      <div className="mb-8 rounded bg-white p-4 shadow">
        {facturacion.data?.length ? (
          <ul className="space-y-2">
            {facturacion.data.map((f) => (
              <li key={f.month} className="flex justify-between text-sm">
                <span className="text-slate-600">{f.month}</span>
                <span className="font-semibold">{Number(f.total).toFixed(2)} €</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Sin facturación registrada</p>
        )}
      </div>

      {can('work_orders.view') && (
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
