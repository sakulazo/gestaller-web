// Certificado de estancia del vehículo en el taller. Documento A4 con el mismo
// esquema de la factura: datos del taller, cliente y fechas de entrada/salida
// por vehículo, más la descripción de la orden. Se imprime automáticamente al
// cargar y la ventana se cierra tras el diálogo de impresión.

import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCompanyProfile, getWorkOrder } from '../services'
import './invoice-print.css'
import './certificate-print.css'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${formatDate(iso)} ${hh}:${mi}`
}

const spanishMonths = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function formatLongDate(iso: string | null | undefined): string {
  if (!iso) return '_____'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '_____'
  const dd = String(d.getDate()).padStart(2, '0')
  return `${dd} de ${spanishMonths[d.getMonth()]} de ${d.getFullYear()}`
}

function today(): Date {
  return new Date()
}

export default function CertificatePrint() {
  const { id } = useParams()
  const workOrderId = Number(id)

  const workOrderQuery = useQuery({
    queryKey: ['work-order', workOrderId],
    queryFn: () => getWorkOrder(workOrderId),
    enabled: Number.isFinite(workOrderId) && workOrderId > 0,
  })
  const profileQuery = useQuery({ queryKey: ['company-profile'], queryFn: getCompanyProfile })

  const workOrder = workOrderQuery.data

  const loading = workOrderQuery.isLoading || profileQuery.isLoading || !workOrder

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
    return <p className="p-8 text-sm text-slate-500">Cargando certificado…</p>
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
    name: workOrder.client_name ?? '',
    address: workOrder.client_address ?? '',
    city: workOrder.client_city ?? '',
    state: workOrder.client_state ?? '',
    tax_id: workOrder.client_tax_id ?? '',
    phone: workOrder.client_phone ?? '',
    email: workOrder.client_email ?? '',
  }

  const vehicles = [
    {
      kind: 'Vehículo',
      plate: workOrder.motor_plate ?? workOrder.motor_vehicle?.plate ?? '',
      make: workOrder.motor_make ?? workOrder.motor_vehicle?.make ?? '',
      model: workOrder.motor_model ?? workOrder.motor_vehicle?.model ?? null,
    },
    {
      kind: 'Remolque',
      plate: workOrder.trailer_plate ?? workOrder.trailer_vehicle?.plate ?? '',
      make: workOrder.trailer_make ?? workOrder.trailer_vehicle?.make ?? '',
      model: workOrder.trailer_model ?? workOrder.trailer_vehicle?.model ?? null,
    },
  ].filter((v) => v.plate)

  const now = today()

  return (
    <div className="print-screen">
      <main className="invoice-page certificate-page">
        <header className="invoice-header">
          <div className="invoice-company">
            <p className="invoice-company-name">{issuer.legal_name}</p>
            {issuer.tax_id && <p>NIF: {issuer.tax_id}</p>}
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
            <h1>CERTIFICADO DE ESTANCIA</h1>
            <p><strong>Nº de orden:</strong> {workOrder.number}</p>
          </div>
        </header>

        <section className="certificate-statement">
          <p><strong>CERTIFICA</strong>, que el vehículo o conjunto de vehículos,
          propiedad de <strong>{client.name}</strong>, cuyas características se
          detallan a continuación, ha permanecido depositado en nuestras
          instalaciones para su diagnóstico y/o reparación desde{' '}
          <strong>{formatLongDate(workOrder.checked_in_at)}</strong> hasta{' '}
          <strong>{formatLongDate(workOrder.delivered_at)}</strong>.
          {' '}Y para que así conste, se expide el presente certificado.</p>
        </section>

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
            </p>
            {client.phone && <p>Tel: {client.phone}</p>}
            {client.email && <p>{client.email}</p>}
          </div>
          {vehicles.length > 0 && (
            <div>
              <p className="section-title">Vehículo</p>
              {vehicles.map((v) => (
                <div key={v.kind}>
                  {v.kind === 'Remolque' && (
                    <p className="section-title" style={{ marginTop: 8 }}>Remolque</p>
                  )}
                  <p><strong>{v.plate}</strong></p>
                  {(v.make || v.model) && (
                    <p>{[v.make, v.model].filter(Boolean).join(' ')}</p>
                  )}
                  {v.kind === 'Vehículo' && workOrder.mileage != null && (
                    <p>Kilometraje: {workOrder.mileage.toLocaleString('es-ES')} km</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <table className="invoice-items">
          <thead>
            <tr>
              <th>Vehículo</th>
              <th>Matrícula</th>
              <th>Entrada</th>
              <th>Salida</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.kind}>
                <td>{[v.make, v.model].filter(Boolean).join(' ') || v.kind}</td>
                <td className="ta-center"><strong>{v.plate}</strong></td>
                <td className="ta-center">{formatDateTime(workOrder.checked_in_at)}</td>
                <td className="ta-center">{formatDateTime(workOrder.delivered_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="certificate-signature">
          <div className="certificate-signature-box">
            <p>En {[issuer.city, issuer.state].filter(Boolean).join(', ') || '________________'}, a {formatDate(now.toISOString())}</p>
            <br />
            <p>Firma:</p>
            <div className="signature-line" />
          </div>
          <div className="certificate-signature-box">
            <p className="section-title">Sello</p>
            <div className="stamp-box" />
          </div>
        </section>
      </main>
    </div>
  )
}