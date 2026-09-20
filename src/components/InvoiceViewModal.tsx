// Modal de visualización (solo lectura) de una factura emitida.

import Modal from './Modal'
import { lineTotal } from '../components/ItemsForm'
import type { Invoice, Item } from '../types'

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
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

const eur = (n: number) => `${Number(n).toFixed(2)} €`

export default function InvoiceViewModal({
  invoice,
  onClose,
}: {
  invoice: Invoice | null
  onClose: () => void
}) {
  if (!invoice) return null

  const items = invoice.items ?? []

  const clientName = invoice.client_name ?? invoice.client?.name ?? '—'
  const motorVehicle = invoice.motor_plate
    ? {
        plate: invoice.motor_plate,
        make: invoice.motor_make ?? '',
        model: invoice.motor_model,
      }
    : invoice.motor_vehicle
  const trailerVehicle = invoice.trailer_plate
    ? {
        plate: invoice.trailer_plate,
        make: invoice.trailer_make ?? '',
        model: invoice.trailer_model,
      }
    : invoice.trailer_vehicle

  return (
    <Modal open title={`Factura ${invoice.number}`} wide onClose={onClose}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-lg font-semibold text-slate-800">{clientName}</p>
            <p className="mt-1 text-sm text-slate-500">
              Vehículo:{' '}
              <span className="font-medium text-slate-700">{vehicleLabel(motorVehicle)}</span>
              {trailerVehicle && (
                <>
                  {' '}
                  · Remolque:{' '}
                  <span className="font-medium text-slate-700">{vehicleLabel(trailerVehicle)}</span>
                </>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Fecha de emisión</p>
            <p className="text-lg font-semibold text-slate-800">{formatDate(invoice.date)}</p>
            <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              Emitida
            </span>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <DetailRow label="Número" value={invoice.number} />
          <DetailRow label="Fecha de emisión" value={formatDate(invoice.date)} />
          <DetailRow label="Cliente" value={clientName} />
          <DetailRow label="Vehículo a motor" value={vehicleLabel(motorVehicle)} />
          <DetailRow label="Remolque" value={vehicleLabel(trailerVehicle)} />
          <DetailRow label="Orden asociada" value={invoice.work_order_number ?? '—'} />
          <DetailRow label="Kilometraje" value={invoice.mileage != null ? `${invoice.mileage.toLocaleString('es-ES')} km` : '—'} />
        </dl>

        {invoice.notes && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Observaciones</p>
            <p className="mt-1 text-sm whitespace-pre-wrap text-slate-700">{invoice.notes}</p>
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-800">
            Líneas de detalle ({items.length})
          </p>
          {items.length === 0 ? (
            <p className="rounded border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
              Esta factura no tiene líneas de detalle.
            </p>
          ) : (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-center font-medium">Tipo</th>
                    <th className="px-3 py-2 text-center font-medium">Concepto</th>
                    <th className="px-3 py-2 text-center font-medium">Cant.</th>
                    <th className="px-3 py-2 text-center font-medium">P. unitario</th>
                    <th className="px-3 py-2 text-center font-medium">Dto. (%)</th>
                    <th className="px-3 py-2 text-center font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it: Item) => (
                    <tr key={it.id}>
                      <td className="px-3 py-2 text-xs font-medium text-slate-500">
                        {it.item_type === 'service' ? 'Servicio' : 'Producto'}
                      </td>
                      <td className="px-3 py-2">{it.description || '—'}</td>
                      <td className="px-3 py-2">{it.quantity}</td>
                      <td className="px-3 py-2">{eur(it.unit_price)}</td>
                      <td className="px-3 py-2">{it.discount > 0 ? `${it.discount} %` : '—'}</td>
                      <td className="px-3 py-2 text-right font-medium">{eur(lineTotal(it))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 text-slate-700">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right font-semibold">
                      Base imponible
                    </td>
                    <td className="px-3 py-2 text-right">{eur(invoice.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right font-semibold">
                      IVA
                    </td>
                    <td className="px-3 py-2 text-right">{eur(invoice.taxes)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-right font-bold">
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold">{eur(invoice.total)}</td>
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