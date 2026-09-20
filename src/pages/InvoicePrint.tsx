// Impresión de factura (documento A4; se imprime automáticamente y la
// ventana se cierra tras el diálogo de impresión).
//
// Los datos de cliente, vehículo, empresa emisora e IVA se leen del snapshot
// congelado en la propia factura; sólo si falta (facturas antiguas) se cae a
// los datos vivos del maestro.

import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCompanyProfile, getInvoice } from '../services'
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

  const invoice = invoiceQuery.data

  const loading = invoiceQuery.isLoading || profileQuery.isLoading || !invoice

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

  const issuer = {
    legal_name: invoice.issuer_legal_name ?? profile?.legal_name ?? '',
    tax_id: invoice.issuer_tax_id ?? profile?.tax_id ?? '',
    address: invoice.issuer_address ?? profile?.address ?? '',
    city: invoice.issuer_city ?? profile?.city ?? '',
    state: invoice.issuer_state ?? profile?.state ?? '',
    postal_code: invoice.issuer_postal_code ?? profile?.postal_code ?? '',
    phone: invoice.issuer_phone ?? profile?.phone ?? '',
    email: invoice.issuer_email ?? profile?.email ?? '',
  }

  const client = {
    name: invoice.client_name ?? invoice.client?.name ?? '',
    tax_id: invoice.client_tax_id ?? invoice.client?.tax_id ?? '',
    address: invoice.client_address ?? invoice.client?.address ?? '',
    city: invoice.client_city ?? invoice.client?.city ?? '',
    state: invoice.client_state ?? invoice.client?.state ?? '',
    postal_code: invoice.client_postal_code ?? invoice.client?.postal_code ?? '',
    phone: invoice.client_phone ?? invoice.client?.phone ?? '',
    email: invoice.client_email ?? invoice.client?.email ?? '',
  }

  const motor = {
    plate: invoice.motor_plate ?? invoice.motor_vehicle?.plate ?? '',
    make: invoice.motor_make ?? invoice.motor_vehicle?.make ?? '',
    model: invoice.motor_model ?? invoice.motor_vehicle?.model ?? null,
  }

  const trailer = {
    plate: invoice.trailer_plate ?? invoice.trailer_vehicle?.plate ?? '',
    make: invoice.trailer_make ?? invoice.trailer_vehicle?.make ?? '',
    model: invoice.trailer_model ?? invoice.trailer_vehicle?.model ?? null,
  }
  const hasTrailer = Boolean(invoice.trailer_plate || invoice.trailer_vehicle)

  const taxGroups = Array.from(
    invoice.items.reduce((groups, it) => {
      const rate = it.tax_rate ?? null
      const key = rate == null ? 'null' : String(rate)
      const line = it.quantity * it.unit_price * (1 - it.discount / 100)
      const g = groups.get(key) ?? { base: 0, rate }
      g.base += line
      groups.set(key, g)
      return groups
    }, new Map<string, { base: number; rate: number | null }>()),
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
          <p className="invoice-company-name">{issuer.legal_name}</p>
          <p>NIF: {issuer.tax_id}</p>
          <p>{issuer.address}</p>
          <p>
            {[
              issuer.city ? issuer.city : null,
              issuer.state ? `(${issuer.state.toUpperCase()})` : null,
            ]
              .filter(Boolean)
              .join(' ')}
            {issuer.postal_code ? `, cp ${issuer.postal_code}` : ''}
          </p>
          {issuer.phone && <p>Tel: {issuer.phone}</p>}
          {issuer.email && <p>{issuer.email}</p>}
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
          <p><strong>{client.name}</strong></p>
          {client.tax_id && <p>NIF: {client.tax_id}</p>}
          <p>{client.address}</p>
          <p>
            {[
              client.city ? client.city : null,
              client.state ? `(${client.state.toUpperCase()})` : null,
            ]
              .filter(Boolean)
              .join(' ')}
            {client.postal_code ? `, cp ${client.postal_code}` : ''}
          </p>
          {client.phone && <p>Tel: {client.phone}</p>}
          {client.email && <p>{client.email}</p>}
        </div>
        <div>
          <p className="section-title">Vehículo</p>
          <p><strong>{motor.plate || '—'}</strong></p>
          {motor.make && (
            <p>{[motor.make, motor.model].filter(Boolean).join(' ')}</p>
          )}
          {invoice.mileage != null && <p>Kilometraje: {invoice.mileage.toLocaleString('es-ES')} km</p>}
          {hasTrailer && (
            <>
              <p className="section-title" style={{ marginTop: 8 }}>Remolque</p>
              <p><strong>{trailer.plate}</strong></p>
              {trailer.make && (
                <p>{[trailer.make, trailer.model].filter(Boolean).join(' ')}</p>
              )}
            </>
          )}
        </div>
      </section>

      <table className="invoice-items">
        <thead>
          <tr>
            <th className="text-center">Descripción</th>
            <th className="text-center">Cant.</th>
            <th className="text-center">PVP</th>
            <th className="text-center">%DTO</th>
            <th className="text-center">IVA</th>
            <th className="text-center">Importe</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((it, i) => {
            const line = it.quantity * it.unit_price * (1 - it.discount / 100)
            return (
              <tr key={i}>
                <td>{it.description ?? ''}</td>
                <td className="ta-center">{it.quantity}</td>
                <td className="ta-right">{formatNumber(it.unit_price)}</td>
                <td className="ta-center">{it.discount ? `${it.discount} %` : '—'}</td>
                <td className="ta-center">{it.tax_rate != null ? `${it.tax_rate}%` : '—'}</td>
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
              <tr key={g.key}>
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
