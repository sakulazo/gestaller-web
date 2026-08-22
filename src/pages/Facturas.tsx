// Facturas (creación con líneas, anular).

import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'
import ItemsForm, { itemTotal } from '../components/ItemsForm'
import SearchSelect from '../components/SearchSelect'
import { btnGhost, btnPrimary, btnSuccess, inputCls, labelCls } from '../components/ui'
import { FieldError, FormTextarea } from '../components/Form'
import { useToast } from '../components/Toast'
import { useFormMutation } from '../hooks/useFormMutation'
import {
  createInvoice,
  listClients,
  listInvoices,
  listProducts,
  listServices,
  listVehicleCategories,
  listVehicles,
  updateInvoice,
  voidInvoice,
} from '../services'
import { invoiceSchema } from '../lib/validation'
import type { Invoice, InvoiceInput, ItemInput } from '../types'

function vehicleLabel(v: { plate: string; make: string; model: string | null }) {
  return `${v.plate} — ${v.make} ${v.model ?? ''}`.trim()
}

export default function Facturas() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [items, setItems] = useState<ItemInput[]>([])
  const [clientId, setClientId] = useState('')
  const [motorVehicleId, setMotorVehicleId] = useState('')
  const [trailerVehicleId, setTrailerVehicleId] = useState('')

  const query = useQuery({ queryKey: ['invoices'], queryFn: listInvoices })
  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: listServices })
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts })
  const categoriesQuery = useQuery({ queryKey: ['vehicle-categories'], queryFn: listVehicleCategories })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['invoices'] })

  const voidMutation = useMutation({
    mutationFn: voidInvoice,
    onSuccess: invalidate,
  })
  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Invoice, InvoiceInput>({
    mutationFn: (payload) =>
      editing ? updateInvoice(editing.id, payload) : createInvoice(payload),
    schema: invoiceSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      setItems([])
      toast.success(editing ? 'Factura actualizada correctamente' : 'Factura creada correctamente')
    },
  })

  const vehiclesOf = useMemo(
    () => (cid: string) =>
      !cid
        ? vehiclesQuery.data ?? []
        : (vehiclesQuery.data ?? []).filter((v) => String(v.client_id) === cid),
    [vehiclesQuery.data],
  )

  const categoryMap = useMemo(() => {
    const m = new Map<number, boolean>()
    for (const c of categoriesQuery.data ?? []) m.set(c.id, c.is_self_propelled)
    return m
  }, [categoriesQuery.data])

  const motorVehiclesOf = useMemo(
    () => (cid: string) =>
      vehiclesOf(cid).filter((v) => v.category_id != null && categoryMap.get(v.category_id) === true),
    [vehiclesOf, categoryMap],
  )

  const trailerVehiclesOf = useMemo(
    () => (cid: string) =>
      vehiclesOf(cid).filter((v) => v.category_id != null && categoryMap.get(v.category_id) === false),
    [vehiclesOf, categoryMap],
  )

  const openCreate = () => {
    setEditing(null)
    setItems([])
    setClientId('')
    setMotorVehicleId('')
    setTrailerVehicleId('')
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (f: Invoice) => {
    setEditing(f)
    setItems(f.items.map(({ id: _id, ...rest }) => rest))
    setClientId(String(f.client_id))
    setMotorVehicleId(f.motor_vehicle_id ? String(f.motor_vehicle_id) : '')
    setTrailerVehicleId(f.trailer_vehicle_id ? String(f.trailer_vehicle_id) : '')
    resetErrors()
    setModalOpen(true)
  }

  const clientsUnavailable = clientsQuery.isError
  const vehiclesUnavailable = vehiclesQuery.isError

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: InvoiceInput = {
      client_id: Number(form.get('client_id')),
      motor_vehicle_id: form.get('motor_vehicle_id') ? Number(form.get('motor_vehicle_id')) : null,
      trailer_vehicle_id: form.get('trailer_vehicle_id') ? Number(form.get('trailer_vehicle_id')) : null,
      mileage: form.get('mileage') ? Number(form.get('mileage')) : null,
      taxes: Number(form.get('taxes') ?? 0),
      notes: String(form.get('notes') ?? '').trim() || null,
      items,
    }
    saveMutate(payload)
  }

  const columns: Column<Invoice>[] = [
    { key: 'number', header: 'Número' },
    { key: 'client_id', header: 'Cliente ID' },
    {
      key: 'motor_vehicle_id',
      header: 'Vehículo a motor',
      render: (f) => f.motor_vehicle ? vehicleLabel(f.motor_vehicle) : '—',
    },
    {
      key: 'trailer_vehicle_id',
      header: 'Remolque',
      render: (f) => f.trailer_vehicle ? vehicleLabel(f.trailer_vehicle) : '—',
    },
    {
      key: 'mileage',
      header: 'Kilometraje',
      render: (f) => f.mileage != null ? `${f.mileage.toLocaleString('es-ES')} km` : '—',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (f) => (f.status === 'emitida' ? 'Emitida' : 'Anulada'),
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      render: (f) => `${Number(f.subtotal).toFixed(2)} €`,
    },
    {
      key: 'taxes',
      header: 'Impuestos',
      render: (f) => `${Number(f.taxes).toFixed(2)} €`,
    },
    {
      key: 'total',
      header: 'Total',
      render: (f) => `${Number(f.total).toFixed(2)} €`,
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Facturas</h1>
        {can('invoices.create') && (
          <button onClick={openCreate} className={btnPrimary}>
            Nueva factura
          </button>
        )}
      </div>

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={query.data ?? []}
          rowKey={(f) => f.id}
          onEdit={openEdit}
          editPermission="invoices.edit"
          renderActions={(f) =>
            can('invoices.void') && f.status === 'emitida' ? (
              <button
                onClick={() => voidMutation.mutate(f.id)}
                className="mr-3 text-amber-600 hover:text-amber-800"
              >
                Anular
              </button>
            ) : null
          }
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar factura ${editing.number}` : 'Nueva factura'}
        onClose={() => { setModalOpen(false); setEditing(null); resetErrors() }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              {editing && clientsUnavailable ? (
                <>
                  <input type="hidden" name="client_id" value={editing.client_id} />
                  <label className={labelCls}>Cliente *</label>
                  <input
                    value={`Cliente ${editing.client_id}`}
                    disabled
                    className={`${inputCls} w-full opacity-70`}
                  />
                  <p className="text-xs text-slate-400">Sin permiso para modificar el cliente</p>
                </>
              ) : (
                <>
                  <label className={labelCls}>Cliente *</label>
                  <SearchSelect
                    name="client_id"
                    required
                    placeholder="Selecciona cliente…"
                    options={(clientsQuery.data ?? []).map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    value={clientId}
                    onChange={(v) => {
                      setClientId(v)
                      if (
                        motorVehicleId &&
                        !motorVehiclesOf(v).some((veh) => String(veh.id) === motorVehicleId)
                      ) {
                        setMotorVehicleId('')
                      }
                      if (
                        trailerVehicleId &&
                        !trailerVehiclesOf(v).some((veh) => String(veh.id) === trailerVehicleId)
                      ) {
                        setTrailerVehicleId('')
                      }
                    }}
                  />
                  <FieldError message={fieldErrors.client_id} />
                </>
              )}
            </div>
            <div>
              {editing && vehiclesUnavailable ? (
                <>
                  <input type="hidden" name="motor_vehicle_id" value={editing.motor_vehicle_id ?? ''} />
                  <label className={labelCls}>Vehículo a motor</label>
                  <input
                    value={editing.motor_vehicle ? vehicleLabel(editing.motor_vehicle) : '—'}
                    disabled
                    className={`${inputCls} w-full opacity-70`}
                  />
                </>
              ) : (
                <>
                  <label className={labelCls}>Vehículo a motor</label>
                  <SearchSelect
                    name="motor_vehicle_id"
                    placeholder="Sin vehículo a motor"
                    options={motorVehiclesOf(clientId).map((v) => ({
                      value: String(v.id),
                      label: vehicleLabel(v),
                    }))}
                    value={motorVehicleId}
                    onChange={setMotorVehicleId}
                  />
                  <FieldError message={fieldErrors.motor_vehicle_id} />
                </>
              )}
            </div>
            <div>
              {editing && vehiclesUnavailable ? (
                <>
                  <input type="hidden" name="trailer_vehicle_id" value={editing.trailer_vehicle_id ?? ''} />
                  <label className={labelCls}>Remolque</label>
                  <input
                    value={editing.trailer_vehicle ? vehicleLabel(editing.trailer_vehicle) : '—'}
                    disabled
                    className={`${inputCls} w-full opacity-70`}
                  />
                </>
              ) : (
                <>
                  <label className={labelCls}>Remolque</label>
                  <SearchSelect
                    name="trailer_vehicle_id"
                    placeholder="Sin remolque"
                    options={trailerVehiclesOf(clientId).map((v) => ({
                      value: String(v.id),
                      label: vehicleLabel(v),
                    }))}
                    value={trailerVehicleId}
                    onChange={setTrailerVehicleId}
                  />
                </>
              )}
            </div>
            {motorVehicleId && (
              <div>
                <label className={labelCls}>Kilometraje</label>
                <input
                  name="mileage"
                  type="number"
                  min={0}
                  defaultValue={editing?.mileage ?? ''}
                  placeholder="km"
                  className={`${inputCls} w-full`}
                />
                <FieldError message={fieldErrors.mileage} />
              </div>
            )}
            <div>
              <label className={labelCls}>Impuestos (€)</label>
              <input name="taxes" type="number" step="0.01" min={0} defaultValue={editing?.taxes ?? 0} className={`${inputCls} w-full`} />
            </div>
            <div className="col-span-2">
              <FormTextarea
                name="notes"
                label="Observaciones"
                rows={3}
                defaultValue={editing?.notes ?? ''}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Líneas de detalle</label>
            <ItemsForm
              items={items}
              onChange={setItems}
              services={servicesQuery.data}
              products={productsQuery.data}
            />
            <p className="mt-2 text-sm text-slate-600">
              Subtotal estimado: <strong>{itemTotal(items).toFixed(2)} €</strong>
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnGhost}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className={btnSuccess}>
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
