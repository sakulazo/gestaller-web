// Histórico de órdenes de trabajo entregadas, con el desenlace (completada/cancelada).
// Un clic en un registro abre un modal con toda la información de la orden y sus items.

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { btnGhost } from '../components/ui'
import { useNavigate } from 'react-router-dom'
import { statusColors as orderStatusColors, statusLabels as orderStatusLabels } from './Ordenes'
import { listClients, listUsers, listWorkOrderHistory } from '../services'
import type { WorkOrder, WorkOrderItem } from '../types'

const formatDate = (iso: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const itemStatusLabels: Record<string, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  completado: 'Completado',
  cancelado: 'Cancelado',
  producto: 'Producto',
}

const itemStatusColors: Record<string, string> = {
  pendiente: 'bg-slate-100 text-slate-700',
  asignado: 'bg-blue-100 text-blue-700',
  completado: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
  producto: 'bg-slate-100 text-slate-700',
}

function ExecutionBadge({ order }: { order: WorkOrder }) {
  if (order.cancelled_at) {
    return (
      <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
        Cancelada
      </span>
    )
  }
  if (order.completed_at) {
    return (
      <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
        Completada
      </span>
    )
  }
  return <span className="text-xs text-slate-400">—</span>
}

function vehicleLabel(v: { plate: string; make: string; model: string | null } | null) {
  if (!v) return '—'
  return `${v.plate} — ${v.make} ${v.model ?? ''}`.trim()
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-700">{value}</dd>
    </div>
  )
}

function OrderDetailModal({
  order,
  clientMap,
  userName,
  onClose,
}: {
  order: WorkOrder | null
  clientMap: Map<number, string>
  userName: (uid: number | null) => string
  onClose: () => void
}) {
  if (!order) return null
  const items = order.items ?? []
  const total = items.reduce((acc, it) => acc + (it.duration_minutes ?? 0), 0)

  return (
    <Modal open title={`Orden ${order.number}`} wide onClose={onClose}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-800">
              {clientMap.get(order.client_id) ?? `Cliente ${order.client_id}`}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Vehículo:{' '}
              <span className="font-medium text-slate-700">{vehicleLabel(order.motor_vehicle)}</span>
              {order.trailer_vehicle && (
                <>
                  {' '}
                  · Remolque:{' '}
                  <span className="font-medium text-slate-700">{vehicleLabel(order.trailer_vehicle)}</span>
                </>
              )}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  orderStatusColors[order.derived_status] ?? 'bg-slate-100 text-slate-600'
                }`}
              >
                {orderStatusLabels[order.derived_status] ?? order.derived_status}
              </span>
              <ExecutionBadge order={order} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Tiempo total</p>
            <p className="text-2xl font-bold text-slate-800">{total} min</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <DetailRow label="Cliente" value={clientMap.get(order.client_id) ?? `Cliente ${order.client_id}`} />
          <DetailRow label="Motor / Remolque" value={vehicleLabel(order.motor_vehicle)} />
          {order.trailer_vehicle && <DetailRow label="Remolque" value={vehicleLabel(order.trailer_vehicle)} />}
          <DetailRow label="Kilometraje" value={order.mileage != null ? `${order.mileage.toLocaleString('es-ES')} km` : '—'} />
          <DetailRow label="Apertura" value={formatDate(order.opened_at)} />
          <DetailRow label="Ingreso al taller" value={formatDate(order.checked_in_at)} />
          <DetailRow label="Completado" value={formatDate(order.completed_at)} />
          <DetailRow label="Cancelado" value={formatDate(order.cancelled_at)} />
          <DetailRow label="Entrega" value={formatDate(order.delivered_at)} />
        </dl>

        {(order.description || order.notes) && (
          <div className="space-y-3">
            {order.description && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Descripción</p>
                <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{order.description}</p>
              </div>
            )}
            {order.notes && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Observaciones</p>
                <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{order.notes}</p>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Líneas de detalle ({items.length})
          </p>
          {items.length === 0 ? (
            <p className="rounded border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              Esta orden no tiene líneas de detalle.
            </p>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Tipo</th>
                    <th className="px-3 py-2 text-left font-medium">Concepto</th>
                    <th className="px-3 py-2 text-left font-medium">Asignado a</th>
                    <th className="px-3 py-2 text-left font-medium">Cant.</th>
                    <th className="px-3 py-2 text-left font-medium">Tiempo (min)</th>
                    <th className="px-3 py-2 text-left font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 text-xs font-medium text-slate-500">
                        {it.item_type === 'service' ? 'Servicio' : 'Producto'}
                      </td>
                      <td className="px-3 py-2">{it.description || '—'}</td>
                      <td className="px-3 py-2 text-slate-600">{userName(it.assigned_to)}</td>
                      <td className="px-3 py-2">{it.quantity}</td>
                      <td className="px-3 py-2">{it.duration_minutes != null ? `${it.duration_minutes} min` : '—'}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            itemStatusColors[(it as WorkOrderItem).derived_status] ?? 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {itemStatusLabels[(it as WorkOrderItem).derived_status] ?? (it as WorkOrderItem).derived_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 text-slate-700">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right font-semibold">
                      Total
                    </td>
                    <td className="px-3 py-2 font-bold">{total} min</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default function HistoricoOrdenes() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<WorkOrder | null>(null)

  const query = useQuery({
    queryKey: ['work-order-history'],
    queryFn: listWorkOrderHistory,
  })
  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: listUsers })

  const clientMap = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of clientsQuery.data ?? []) m.set(c.id, c.name)
    return m
  }, [clientsQuery.data])

  const userName = useMemo(() => {
    const m = new Map<number, string>()
    for (const u of usersQuery.data ?? []) m.set(u.id, u.name)
    return (uid: number | null) => (uid != null ? m.get(uid) ?? `Usuario ${uid}` : '—')
  }, [usersQuery.data])

  const columns: Column<WorkOrder>[] = [
    { key: 'number', header: 'Código' },
    {
      key: 'client_id',
      header: 'Cliente',
      render: (o) => clientMap.get(o.client_id) ?? `Cliente ${o.client_id}`,
    },
    {
      key: 'motor_vehicle_id',
      header: 'Vehículo',
      render: (o) => o.motor_vehicle?.plate ?? '—',
    },
    {
      key: 'trailer_vehicle_id',
      header: 'Remolque',
      render: (o) => o.trailer_vehicle?.plate ?? '—',
    },
    {
      key: 'delivered_at',
      header: 'Fecha de entrega',
      render: (o) => formatDate(o.delivered_at),
    },
    {
      key: 'execution',
      header: 'Ejecución',
      render: (o) => <ExecutionBadge order={o} />,
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Histórico de órdenes</h1>
        <button type="button" onClick={() => navigate('/work-orders')} className={btnGhost}>
          Volver a órdenes
        </button>
      </div>

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={query.data ?? []}
          rowKey={(o) => o.id}
          onRowClick={(o) => setSelected(o)}
        />
      )}

      <OrderDetailModal
        order={selected}
        clientMap={clientMap}
        userName={userName}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
