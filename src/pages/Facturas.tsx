// Facturas (listado y creación con líneas; las emitidas no se modifican).

import { useState } from 'react'
import DataTable, { type Column } from '../components/DataTable'
import InvoiceFormModal from '../components/InvoiceFormModal'
import InvoiceViewModal from '../components/InvoiceViewModal'
import { useAuth } from '../hooks/useAuth'
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { btnPrimary } from '../components/ui'
import { listInvoices } from '../services'
import type { Invoice } from '../types'

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Facturas() {
  const { can } = useAuth()
  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<Invoice | null>(null)

  const { items, total, page, totalPages, pageSize, setPage, isLoading } =
    usePaginatedQuery<Invoice>(['invoices'], listInvoices)

  const columns: Column<Invoice>[] = [
    { key: 'number', header: 'Número' },
    { key: 'date', header: 'Fecha emisión', render: (f) => formatDate(f.date) },
    { key: 'client', header: 'Cliente', render: (f) => f.client_name ?? f.client?.name ?? '—' },
    {
      key: 'motor_vehicle_id',
      header: 'Vehículos',
      render: (f) => {
        const plates: string[] = []
        const motor = f.motor_plate ?? f.motor_vehicle?.plate
        const trailer = f.trailer_plate ?? f.trailer_vehicle?.plate
        if (motor) plates.push(motor)
        if (trailer) plates.push(trailer)
        return plates.length ? plates.join(' — ') : '—'
      },
    },
    {
      key: 'work_order_number',
      header: 'Orden asociada',
      render: (f) => f.work_order_number ?? '—',
    },
    {
      key: 'mileage',
      header: 'Kilometraje',
      render: (f) => f.mileage != null ? `${f.mileage.toLocaleString('es-ES')} km` : '—',
    },
    {
      key: 'total',
      header: 'Total',
      render: (f) => `${Number(f.total).toFixed(2)} €`,
    },
    {
      key: 'print',
      header: '',
        render: (f) => (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); window.open(`/invoices/${f.id}/print`, '_blank') }}
            className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
          >
            Imprimir
          </button>
        ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Facturas</h1>
        {can('invoices.create') && (
          <button onClick={() => setModalOpen(true)} className={btnPrimary}>
            Nueva factura
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(f) => f.id}
          onRowClick={(f) => setSelected(f)}
          pagination={{ page, totalPages, total, pageSize, onPageChange: setPage }}
        />
      )}

      <InvoiceFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => setModalOpen(false)}
      />

      <InvoiceViewModal
        invoice={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}