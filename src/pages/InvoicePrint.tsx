// Impresión de factura (documento A4; se imprime automáticamente y la
// ventana se cierra tras el diálogo de impresión).

import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  getCompanyProfile,
  getInvoice,
  listTaxRates,
} from '../services'
import './invoice-print.css'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function formatNumber(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function InvoicePrint() {
  const { id } = useParams()
  const invoiceId = Number(id)

  const invoiceQuery = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: Number.isFinite(invoiceId) && invoiceId > 0,
  })
  const profileQuery = useQuery({ queryKey: ['company-profile'], queryFn: getCompanyProfile })
  const taxRatesQuery = useQuery({
    queryKey: ['tax-rates'],
    queryFn: () => listTaxRates({ all: true }).then((r) => r.items),
  })

  const invoice = invoiceQuery.data

  const taxRateMap = useMemo(() => {
    const m = new Map<number, number>()
    for (const r of taxRatesQuery.data ?? []) m.set(r.id, Number(r.rate))
    return m
  }, [taxRatesQuery.data])

  const loading =
    invoiceQuery.isLoading || profileQuery.isLoading || taxRatesQuery.isLoading || !invoice

  useEffect(() => {
    if (loading) return
    window.print()
  }, [loading])

  useEffect(() => {
    const closeAfterPrint = () => window.close()
    window.addEventListener('afterprint', closeAfterPrint)
    return () => window.removeEventListener('afterprint', closeAfterPrint)
  }, [])

  if (loading) {
    return <p className="p-8 text-sm text-slate-500">Cargando factura…</p>
  }

  const profile = profileQuery.data

  const taxGroups = Array.from(
    invoice.items.reduce((groups, it) => {
      const key = it.tax_rate_id ?? null
      const line = it.quantity * it.unit_price * (1 - it.discount / 100)
      const g = groups.get(key) ?? {
        base: 0,
        rate: key != null ? taxRateMap.get(key) : undefined,
      }
      g.base += line
      groups.set(key, g)
      return groups
    }, new Map<number | null, { base: number; rate: number | undefined }>()),
  ).map(([key, g]) => ({
    key,
    base: g.base,
    rate: g.rate,
    iva: g.rate != null ? (g.base * g.rate) / 100 : 0,
  }))

  return (
    <main className="invoice-page">
      <header className="invoice-header">
        <div className="invoice-company">
          <p className="invoice-company-name">{profile?.legal_name ?? ''}</p>
          <p>NIF: {profile?.tax_id ?? ''}</p>
          <p>{profile?.address ?? ''}</p>
          <p>
            {[
              profile?.city ? profile.city : null,
              profile?.state ? `(${profile.state.toUpperCase()})` : null,
            ]
              .filter(Boolean)
              .join(' ')}
            {profile?.postal_code ? `, cp ${profile.postal_code}` : ''}
          </p>
          {profile?.phone && <p>Tel: {profile.phone}</p>}
          {profile?.email && <p>{profile.email}</p>}
        </div>
        <div className="invoice-meta">
          <h1>FACTURA</h1>
          <p><strong>Número:</strong> {invoice.number}</p>
          <p><strong>Fecha:</strong> {formatDate(invoice.date)}</p>
          {invoice.work_order_id != null && (
            <p><strong>Orden:</strong> {invoice.work_order_number ?? '—'}</p>
          )}
        </div>
      </header>

      <section className="invoice-parties">
        <div>
          <p className="section-title">Datos del cliente</p>
          <p><strong>{invoice.client.name}</strong></p>
          {invoice.client.tax_id && <p>NIF: {invoice.client.tax_id}</p>}
          <p>{invoice.client.address}</p>
          <p>
            {[
              invoice.client.city ? invoice.client.city : null,
              invoice.client.state ? `(${invoice.client.state.toUpperCase()})` : null,
            ]
              .filter(Boolean)
              .join(' ')}
            {invoice.client.postal_code ? `, cp ${invoice.client.postal_code}` : ''}
          </p>
          {invoice.client.phone && <p>Tel: {invoice.client.phone}</p>}
          {invoice.client.email && <p>{invoice.client.email}</p>}
        </div>
        <div>
          <p className="section-title">Vehículo</p>
          <p><strong>{invoice.motor_vehicle?.plate ?? '—'}</strong></p>
          {invoice.motor_vehicle?.make && (
            <p>
              {[invoice.motor_vehicle.make, invoice.motor_vehicle.model].filter(Boolean).join(' ')}
            </p>
          )}
          {invoice.mileage != null && <p>Kilometraje: {invoice.mileage.toLocaleString('es-ES')} km</p>}
          {invoice.trailer_vehicle && (
            <>
              <p className="section-title" style={{ marginTop: 8 }}>Remolque</p>
              <p><strong>{invoice.trailer_vehicle.plate}</strong></p>
              {invoice.trailer_vehicle.make && (
                <p>
                  {[invoice.trailer_vehicle.make, invoice.trailer_vehicle.model]
                    .filter(Boolean)
                    .join(' ')}
                </p>
              )}
            </>
          )}
        </div>
      </section>

      <table className="invoice-items">
        <thead>
          <tr>
            <th className="col-desc">Descripción</th>
            <th className="ta-right">Cant.</th>
            <th className="ta-right">PVP</th>
            <th className="ta-right">%DTO</th>
            <th className="ta-right">IVA</th>
            <th className="ta-right">Importe</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, i) => {
            const line = it.quantity * it.unit_price * (1 - it.discount / 100)
            const rate = it.tax_rate_id != null ? taxRateMap.get(it.tax_rate_id) : undefined
            return (
              <tr key={i}>
                <td>{it.description ?? ''}</td>
                <td className="ta-center">{it.quantity}</td>
                <td className="ta-right">{formatNumber(it.unit_price)}</td>
                <td className="ta-center">{it.discount ? `${it.discount} %` : '—'}</td>
                <td className="ta-center">{rate != null ? `${rate}%` : '—'}</td>
                <td className="ta-right">{formatNumber(line)} €</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <section className="invoice-totals">
        <table>
          <tbody>
            <tr className="totals-strong">
              <td>Subtotal</td>
              <td className="ta-right">{formatNumber(invoice.subtotal)} €</td>
            </tr>
            {taxGroups.map((g) => (
              <tr key={g.key ?? 'sin-tasa'}>
                <td>
                  {g.rate != null
                    ? `IVA ${g.rate}% de ${formatNumber(g.base)}`
                    : `Sin IVA de ${formatNumber(g.base)}`}
                </td>
                <td className="ta-right">{formatNumber(g.iva)} €</td>
              </tr>
            ))}
            <tr className="totals-strong totals-final">
              <td>Total EUR</td>
              <td className="ta-right">{formatNumber(invoice.total)} €</td>
            </tr>
          </tbody>
        </table>
      </section>

      {invoice.notes && (
        <p className="invoice-notes">
          <strong>Observaciones:</strong> {invoice.notes}
        </p>
      )}
    </main>
  )
}