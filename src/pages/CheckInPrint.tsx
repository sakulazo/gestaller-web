// Resguardo de depósito para imprimir el registro de entrada del vehículo
// en el taller (recreación del documento Laravel original).

import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getCompanyProfile, getWorkOrder } from '../services'
import CarSilhouette from '../components/CarSilhouette'
import type { CompanyProfile, WorkOrder } from '../types'
import './check-in-print.css'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function ClientAuthorizations({ label }: { label: string }) {
  return (
    <div className="client-authorization">
      <p>{label}</p>
      <span>SI</span>
      <span>NO</span>
    </div>
  )
}

function VehicleSection({ workOrder }: { workOrder: WorkOrder }) {
  const make = workOrder.motor_make ?? workOrder.motor_vehicle?.make ?? ''
  const model = workOrder.motor_model ?? workOrder.motor_vehicle?.model ?? ''
  const plate = workOrder.motor_plate ?? workOrder.motor_vehicle?.plate ?? ''
  return (
    <article>
      <p><strong>DATOS DEL VEHÍCULO</strong></p>
      <table>
        <tbody>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="nombre-casilla">MARCA</p>
              <p className="valor-casilla">{make}</p>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="nombre-casilla">MODELO</p>
              <p className="valor-casilla">{model}</p>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="nombre-casilla">MATRÍCULA</p>
              <p className="valor-casilla">{plate}</p>
            </td>
          </tr>
          <tr>
            <td className="casilla">
              <p className="nombre-casilla">KILOMETRAJE</p>
              <p className="valor-casilla">
                {workOrder.mileage != null ? `${workOrder.mileage.toLocaleString('es-ES')} km` : ''}
              </p>
            </td>
            <td className="casilla ta-center">
              <p className="ta-center">¿SEGURO EN VIGOR?</p>
              <p
                className="valor-casilla ta-center"
                style={{ display: 'flex', justifyContent: 'space-around', paddingLeft: 0 }}
              >
                <span className="sino">SI</span>
                <span className="sino">NO</span>
              </p>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="fuel nombre-casilla">
                COMBUSTIBLE R<span /> 1/4<span /> 1/2<span /> 3/4<span /> 4/4<span />
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}

function CompanySection({ profile }: { profile: CompanyProfile | null }) {
  return (
    <article>
      <p><strong>DATOS DEL TALLER / RESPONSABLE DE TRATAMIENTO DE DATOS</strong></p>
      <table>
        <tbody>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="nombre-casilla">NOMBRE / RAZÓN SOCIAL</p>
              <p className="valor-casilla">{profile?.legal_name ?? ''}</p>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="nombre-casilla">DIRECCIÓN</p>
              <p className="valor-casilla">{profile?.address ?? ''}</p>
            </td>
          </tr>
          <tr>
            <td className="casilla">
              <p className="nombre-casilla">POBLACIÓN</p>
              <p className="valor-casilla">{profile?.city ?? ''}</p>
            </td>
            <td className="casilla">
              <p className="nombre-casilla">PROVINCIA</p>
              <p className="valor-casilla">{profile?.state ?? ''}</p>
            </td>
          </tr>
          <tr>
            <td className="casilla">
              <p className="nombre-casilla">NIF / CIF</p>
              <p className="valor-casilla">{profile?.tax_id ?? ''}</p>
            </td>
            <td className="casilla">
              <p className="nombre-casilla">Nº EN RIIA</p>
              <p className="valor-casilla">{profile?.rii_number ?? ''}</p>
            </td>
          </tr>
          <tr>
            <td className="casilla">
              <p className="nombre-casilla">TELÉFONO</p>
              <p className="valor-casilla">{profile?.phone ?? ''}</p>
            </td>
            <td className="casilla">
              <p className="nombre-casilla">CORREO ELECTRÓNICO</p>
              <p className="valor-casilla">{profile?.email ?? ''}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}

function ClientSection({ workOrder }: { workOrder: WorkOrder }) {
  const client = {
    name: workOrder.client_name ?? '',
    address: workOrder.client_address ?? '',
    city: workOrder.client_city ?? '',
    state: workOrder.client_state ?? '',
    tax_id: workOrder.client_tax_id ?? '',
    phone: workOrder.client_phone ?? '',
    email: workOrder.client_email ?? '',
  }
  return (
    <article>
      <p><strong>PROPIETARIO Y/O RESPONSABLE DEL VEHÍCULO</strong></p>
      <table>
        <tbody>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="nombre-casilla">NOMBRE / RAZÓN SOCIAL</p>
              <p className="valor-casilla">{client.name}</p>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="nombre-casilla">DIRECCIÓN</p>
              <p className="valor-casilla">{client.address}</p>
            </td>
          </tr>
          <tr>
            <td className="casilla">
              <p className="nombre-casilla">POBLACIÓN</p>
              <p className="valor-casilla">{client.city}</p>
            </td>
            <td className="casilla">
              <p className="nombre-casilla">PROVINCIA</p>
              <p className="valor-casilla">{client.state}</p>
            </td>
          </tr>
          <tr>
            <td className="casilla">
              <p className="nombre-casilla">NIF / CIF</p>
              <p className="valor-casilla">{client.tax_id}</p>
            </td>
            <td className="casilla">
              <p className="nombre-casilla">TELÉFONO</p>
              <p className="valor-casilla">{client.phone}</p>
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="casilla">
              <p className="nombre-casilla">CORREO ELECTRÓNICO</p>
              <p className="valor-casilla">{client.email}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </article>
  )
}

function ServicesTable() {
  return (
    <section className="description">
      <table>
        <colgroup>
          {Array.from({ length: 6 }).map((_, i) => <col key={i} />)}
        </colgroup>
        <thead>
          <tr>
            <th className="text-center">DESCRIPCIÓN SUCINTA DE LA REPARACIÓN Y/O SERVICIO A PRESTAR</th>
            <th className="text-center">UNIDADES/HORAS</th>
            <th className="text-center">P.V.P.</th>
            <th className="text-center">% DTO</th>
            <th className="text-center">% IVA</th>
            <th className="text-center">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 8 }).map((_, i) => (
            <tr key={i}>
              <td />
              <td />
              <td />
              <td />
              <td />
              <td />
            </tr>
          ))}
          <tr>
            <td colSpan={2}>COSTE TOTAL DE LA REPARACIÓN</td>
            <td />
            <td />
            <td />
            <td />
          </tr>
        </tbody>
      </table>
    </section>
  )
}

function LegalText({ workOrder }: { workOrder: WorkOrder }) {
  return (
    <section className="legal-text">
      <article>
        <div>
          <p className="titulo-casilla">DAÑOS EN CARROCERÍA</p>
          <div>
            <CarSilhouette />
          </div>
        </div>
        <div>
          <p className="titulo-casilla">DEPÓSITO DE VEHÍCULO PARA:</p>
          <div>
            <span>CONFECCIÓN DE PRESUPUESTO<input type="checkbox" /></span>
            <span>REPARACIÓN DEL VEHÍCULO<input type="checkbox" /></span>
          </div>
        </div>
        <div>
          <p className="titulo-casilla">FECHA PREVISTA DE ENTREGA</p>
          <p className="valor-casilla" />
        </div>
        <div>
          <p className="titulo-casilla">DEPOSITA PARA PRESUPUESTO:</p>
          <p>FECHA:</p>
        </div>
        <div>
          <p>
            OBSERVACIONES: {workOrder.notes ?? ''}
          </p>
        </div>
      </article>

      <article className="consent">
        <p>
          DE CONFORMIDAD CON LA LEY ORGÁNICA 3/2018, DE 5 DE DICIEMBRE, SOBRE PROTECCIÓN DE DATOS PERSONALES Y
          GARANTÍA DE DERECHOS DIGITALES (LOPDGDD), VD. DA SU CONSENTIMIENTO PARA EL TRATAMIENTO DE LOS
          DATOS APORTADOS EN ESTE FORMULARIO. TRATAMOS LA INFORMACIÓN QUE NOS FACILITA PARA PRESTARLE
          EL SERVICIO SOLICITADO, UTILIZÁNDOLA PARA LA GESTIÓN ADMINISTRATIVA Y COMERCIAL. SUS DATOS NO SERÁN
          CEDIDOS A TERCEROS, SALVO OBLIGACIÓN LEGAL. LE INFORMAMOS QUE PODRÁ EJERCER SUS DERECHOS: SOLICITAR
          EL ACCESO A LOS DATOS PERSONALES RELATIVOS AL INTERESADO, SOLICITAR SU RECTIFICACIÓN O SUPRESIÓN,
          SOLICITAR LA LIMITACIÓN DE SU TRATAMIENTO, OPONERSE A SU TRATAMIENTO Y SOLICITAR SU PORTABILIDAD.
          PODRÁ EJERCERLOS A TRAVÉS CARTA CERTIFICADA, ADJUNTANDO FOTOCOPIA DE SU DNI/PASAPORTE, A LA
          DIRECCIÓN QUE APARECE EN EL APARTADO "DATOS DEL TALLER/RESPONSABLE DE TRATAMIENTO DE DATOS" SITUADA
          EN LA ESQUINA SUPERIOR IZQUIERDA. PUEDE CONSULTAR LA INFORMACIÓN ADICIONAL Y DETALLADA SOBRE
          PROTECCIÓN DE DATOS SOLICITANDO DOCUMENTO INFORMATIVO EXTENSO QUE SE ENCUENTRA A SU DISPOSICIÓN.
        </p>
        <p>
          <label>
            <span>CONSENTIMIENTO TRATAMIENTO DE DATOS</span>
            <input style={{ width: 15, height: 15 }} type="checkbox" />
          </label>
        </p>
      </article>
    </section>
  )
}

function SignatureSection() {
  return (
    <section className="signature">
      <article>
        <div>
          <div>
            AUTORIZO LA REPARACIÓN DEL VEHÍCULO HACIÉNDOME RESPONSABLE DEL PAGO DE LA MISMA.
            ACEPTO QUE EL VEHÍCULO SEA RETENIDO EN PRENDA HASTA EL TOTAL PAGO DE LA FACTURA
            EMITIDA POR EL TRABAJO REALIZADO (ART. 1600 CÓDIGOS CIVIL).
          </div>
          <ClientAuthorizations label="AUTORIZACIÓN DEL CLIENTE" />
        </div>
        <div>
          <div>
            AUTORIZO AL TALLER A EFECTUAR LOS DESPLAZAMIENTOS NECESARIOS PARA LA CORRECTA
            REPARACIÓN O REALIZACIÓN DEL PRESUPUESTO DEL VEHÍCULO. DECLARO TENER SEGURO DEL
            VEHÍCULO EN VIGOR.
          </div>
          <ClientAuthorizations label="AUTORIZACIÓN DEL CLIENTE" />
        </div>
        <div>
          <div>
            OTORGO MI CONFORMIDAD A LA UTILIZACIÓN DE ELEMENTOS Y PIEZAS DE REPUESTO
            RECONSTRUIDAS, USADAS O NO ESPECÍFICAS (ART. 10.1 b y 10.1 c DECRETO 9/2003)
            GARANTIZANDO EL TALLER EL BUEN ESTADO DE LAS MISMAS ASÍ COMO SU BUEN FUNCIONAMIENTO.
          </div>
          <ClientAuthorizations label="AUTORIZACIÓN DEL CLIENTE" />
        </div>
        <div>
          NOTA ACLARATORIA: EN CASO DE NO MARCAJE DE NINGUNA DE LAS CASILLAS ENCUADRADAS DENTRO DE
          "AUTORIZACIÓN DEL CLIENTE" (SI/NO) SE ENTENDERÁ DENEGADA LA AUTORIZACIÓN POR PARTE DEL MISMO
          A LOS TÉRMINOS EN ELLAS ESTABLECIDAS.
        </div>
        <div>
          <div>
            RENUNCIO A LA RETIRADA DE LAS PIEZAS, ELEMENTOS O CONJUNTOS SUSTITUIDOS UNA VEZ
            PRESENTADOS POR EL TALLER EN EL MOMENTO DE LA RETIRADA DEL VEHÍCULO (ART. 10.5 DEL
            DECRETO 9/2003).
          </div>
          <div className="client-signature">
            <p>FIRMA DEL CLIENTE</p>
            <p>FECHA:</p>
          </div>
        </div>
      </article>
      <article className="renunciation">
        <div>RENUNCIA A LA ELABORACIÓN DE UN PRESUPUESTO PREVIO</div>
        <div>
          EL CLIENTE TIENE DERECHO A LA ELABORACIÓN DE UN PRESUPUESTO PREVIO,
          MEDIANTE LA PRESENTE FIRMA EL USUARIO RENUNCIA A LA ELABORACIÓN DE UN PRESUPUESTO PREVIO y AUTORIZA
          A REALIZAR LOS TRABAJOS NECESARIOS PARA LA REPARACIÓN DEL VEHÍCULO Y/O SERVICIOS SOLICITADOS CONFORME
          A LO REFLEJADO EN ESTE RESGUARDO DE DEPÓSITO.
        </div>
        <div className="client-signature">
          <p>EL PRESTADOR DEL SERVICIO</p>
          <p>FECHA:</p>
        </div>
        <div className="client-signature">
          <p>AUTORIZACIÓN DEL CLIENTE</p>
          <p>FECHA:</p>
        </div>
      </article>
    </section>
  )
}

export default function CheckInPrint() {
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
    return <p className="p-8 text-sm text-slate-500">Cargando resguardo…</p>
  }

  return (
    <div className="print-screen">
    <main className="page">
        <header>
          <div>
            <h1>Resguardo de Depósito</h1>
            <h2>EJEMPLAR ORIGINAL DE OBLIGADA ENTREGA AL CLIENTE</h2>
          </div>
          <div>
            <p><strong>RESGUARDO Nº:</strong></p>
            <p>{workOrder.id}</p>
            <p><strong>FECHA DE ENTRADA:</strong></p>
            <p>{formatDate(workOrder.checked_in_at)}</p>
          </div>
        </header>

        <section className="identification">
          <CompanySection profile={profileQuery.data ?? null} />
          <ClientSection workOrder={workOrder} />
          <VehicleSection workOrder={workOrder} />
        </section>

        <LegalText workOrder={workOrder} />
        <ServicesTable />
        <SignatureSection />
      </main>
    </div>
  )
}