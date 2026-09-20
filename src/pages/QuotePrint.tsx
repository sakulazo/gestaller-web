// Impresión de presupuesto (documento A4; se imprime automáticamente y la
// ventana se cierra tras el diálogo de impresión).
//
// Reutiliza la plantilla de factura pero sin IVA: el presupuesto congeló el
// coste bruto (líneas menos descuentos) en `total`. Los datos del emisor se
// leen del perfil del taller (los presupuestos no tienen snapshot de emisor);
// cliente y vehículos se leen del snapshot congelado en el presupuesto.

import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCompanyProfile, getQuote } from '../services'
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

export default function QuotePrint() {
  const { id } = useParams()
  const quoteId = Number(id)

  const quoteQuery = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: () => getQuote(quoteId),
    enabled: Number.isFinite(quoteId) && quoteId > 0,
  })
  const profileQuery = useQuery({ queryKey: ['company-profile'], queryFn: getCompanyProfile })

  const quote = quoteQuery.data

  const loading = quoteQuery.isLoading || profileQuery.isLoading || !quote

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
    return <p className="p-8 text-sm text-slate-500">Cargando presupuesto…</p>
  }

  const profile = profileQuery.data

  const issuer = {
    legal_name: profile?.legal_name ?? '',
    tax_id: profile?.tax_id ?? '',
    address: profile?.address ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    postal_code: profile?.postal_code ?? '',
    phone: profile?.phone ?? '',
    email: profile?.email ?? '',
  }

  const client = {
    name: quote.client_name ?? '',
    tax_id: quote.client_tax_id ?? '',
    address: quote.client_address ?? '',
    city: quote.client_city ?? '',
    state: quote.client_state ?? '',
    postal_code: quote.client_postal_code ?? '',
    phone: quote.client_phone ?? '',
    email: quote.client_email ?? '',
  }

  const motor = quote.motor_vehicle ?? {
    plate: quote.motor_plate,
    make: quote.motor_make,
    model: quote.motor_model,
  }
  const trailer = quote.trailer_vehicle ?? {
    plate: quote.trailer_plate,
    make: quote.trailer_make,
    model: quote.trailer_model,
  }
  const hasTrailer = Boolean(trailer.plate)

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
          <h1>PRESUPUESTO</h1>
          <p><strong>Número:</strong> {quote.number}</p>
          <p><strong>Fecha:</strong> {formatDate(quote.date)}</p>
          <p><strong>Válido hasta:</strong> {formatDate(quote.valid_until)}</p>
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
          {quote.mileage != null && <p>Kilometraje: {quote.mileage.toLocaleString('es-ES')} km</p>}
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
            <th className="text-center">Importe</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((it, i) => {
            const line = it.quantity * it.unit_price * (1 - it.discount / 100)
            return (
              <tr key={i}>
                <td>{it.description ?? ''}</td>
                <td className="ta-center">{it.quantity}</td>
                <td className="ta-right">{formatNumber(it.unit_price)}</td>
                <td className="ta-center">{it.discount ? `${it.discount} %` : '—'}</td>
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
              <td className="ta-right">{formatNumber(quote.total)} €</td>
            </tr>
            <tr className="totals-strong totals-final">
              <td>Total EUR</td>
              <td className="ta-right">{formatNumber(quote.total)} €</td>
            </tr>
          </tbody>
        </table>
      </section>

      {quote.description && (
        <p className="invoice-notes">
          <strong>Descripción:</strong> {quote.description}
        </p>
      )}
      {quote.notes && (
        <p className="invoice-notes">
          <strong>Observaciones:</strong> {quote.notes}
        </p>
      )}
    </main>
  )
}