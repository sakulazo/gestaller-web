// Presupuestos (creación con líneas, aprobar, convertir en orden de trabajo).

import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'
import ItemsForm, { itemTotal } from '../components/ItemsForm'
import SearchSelect from '../components/SearchSelect'
import { btnGhost, btnPrimary, btnSuccess, inputCls, labelCls } from '../components/ui'
import { FieldError, FormTextarea } from '../components/Form'
import { useToast } from '../components/Toast'
import { useFormMutation } from '../hooks/useFormMutation'
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import {
  convertQuote,
  createQuote,
  deleteQuote,
  listClients,
  listProducts,
  listQuotes,
  listServices,
  listVehicleCategories,
  listVehicles,
  updateQuote,
} from '../services'
import { quoteSchema } from '../lib/validation'
import type { ItemInput, Quote, QuoteInput, QuoteStatus } from '../types'

const statusLabels: Record<QuoteStatus, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  convertido: 'Convertido',
}

function vehicleLabel(v: { plate: string; make: string; model: string | null }) {
  return `${v.plate} — ${v.make} ${v.model ?? ''}`.trim()
}

export default function Presupuestos() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [items, setItems] = useState<ItemInput[]>([])
  const [clientId, setClientId] = useState('')
  const [motorVehicleId, setMotorVehicleId] = useState('')
  const [trailerVehicleId, setTrailerVehicleId] = useState('')
  const [pendingDelete, setPendingDelete] = useState(false)

  const { items: rows, total, page, totalPages, pageSize, setPage, isLoading } =
    usePaginatedQuery<Quote>(['quotes'], listQuotes)
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => listClients({ all: true }).then((r) => r.items),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles({ all: true }).then((r) => r.items),
  })
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices({ all: true }).then((r) => r.items),
    enabled: can('services.view'),
  })
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ all: true }).then((r) => r.items),
    enabled: can('products.view'),
  })
  const categoriesQuery = useQuery({
    queryKey: ['vehicle-categories'],
    queryFn: () => listVehicleCategories({ all: true }).then((r) => r.items),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['quotes'] })

  const deleteMutation = useMutation({
    mutationFn: deleteQuote,
    onSuccess: invalidate,
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: QuoteStatus }) =>
      updateQuote(id, { status }),
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      setItems([])
      toast.success('Presupuesto aprobado correctamente')
    },
  })
  const convertMutation = useMutation({
    mutationFn: convertQuote,
    onSuccess: (order) => {
      invalidate()
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      setModalOpen(false)
      setEditing(null)
      setItems([])
      toast.success(`Presupuesto convertido en la orden ${order.number} correctamente`)
    },
  })
  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Quote, QuoteInput>({
    mutationFn: (payload) =>
      editing ? updateQuote(editing.id, payload) : createQuote(payload),
    schema: quoteSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      setItems([])
      toast.success(editing ? 'Presupuesto actualizado correctamente' : 'Presupuesto creado correctamente')
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
  const openEdit = (p: Quote) => {
    setEditing(p)
    setItems(p.items.map(({ id: _id, ...rest }) => rest))
    setClientId(String(p.client_id))
    setMotorVehicleId(p.motor_vehicle_id ? String(p.motor_vehicle_id) : '')
    setTrailerVehicleId(p.trailer_vehicle_id ? String(p.trailer_vehicle_id) : '')
    resetErrors()
    setModalOpen(true)
  }

  const clientsUnavailable = clientsQuery.isError
  const vehiclesUnavailable = vehiclesQuery.isError
  const isFrozen = editing?.status === 'aprobado' || editing?.status === 'convertido'

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: QuoteInput = {
      client_id: Number(form.get('client_id')),
      motor_vehicle_id: form.get('motor_vehicle_id') ? Number(form.get('motor_vehicle_id')) : null,
      trailer_vehicle_id: form.get('trailer_vehicle_id') ? Number(form.get('trailer_vehicle_id')) : null,
      mileage: form.get('mileage') ? Number(form.get('mileage')) : null,
      status: (form.get('status') as QuoteStatus) ?? 'pendiente',
      description: String(form.get('description') ?? '').trim() || null,
      notes: String(form.get('notes') ?? '').trim() || null,
      validity_days: Number(form.get('validity_days') ?? 30),
      items,
    }
    saveMutate(payload)
  }

  const columns: Column<Quote>[] = [
    { key: 'number', header: 'Número' },
    {
      key: 'client_name',
      header: 'Cliente',
      render: (p) => p.client_name ?? `Cliente ${p.client_id}`,
    },
    {
      key: 'motor_vehicle_id',
      header: 'Vehículo a motor',
      render: (p) => {
        const motor = p.motor_make
          ? `${p.motor_plate} — ${p.motor_make} ${p.motor_model ?? ''}`.trim()
          : p.motor_vehicle
            ? vehicleLabel(p.motor_vehicle)
            : '—'
        const trailer = p.trailer_make
          ? `${p.trailer_plate} — ${p.trailer_make} ${p.trailer_model ?? ''}`.trim()
          : p.trailer_vehicle
            ? vehicleLabel(p.trailer_vehicle)
            : p.trailer_plate ?? null
        return (
          <div>
            <div>{motor}</div>
            {trailer && <div className="text-xs font-normal text-slate-400 sm:hidden">{trailer}</div>}
          </div>
        )
      },
    },
    {
      key: 'trailer_vehicle_id',
      header: 'Remolque',
      className: 'hidden sm:table-cell',
      render: (p) => (p.trailer_make ? `${p.trailer_plate} — ${p.trailer_make} ${p.trailer_model ?? ''}`.trim() : p.trailer_vehicle ? vehicleLabel(p.trailer_vehicle) : '—'),
    },
    {
      key: 'mileage',
      header: 'Kilometraje',
      render: (p) => p.mileage != null ? `${p.mileage.toLocaleString('es-ES')} km` : '—',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (p) => statusLabels[p.status] ?? p.status,
    },
    {
      key: 'total',
      header: 'Total',
      render: (p) => `${Number(p.total).toFixed(2)} €`,
    },
    { key: 'valid_until', header: 'Válido hasta' },
    {
      key: 'print',
      header: '',
      render: (p) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); window.open(`/quotes/${p.id}/print`, '_blank') }}
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
        <h1 className="text-page-title font-bold text-slate-800">Presupuestos</h1>
        {can('quotes.create') && (
          <button onClick={openCreate} className={btnPrimary}>
            Nuevo presupuesto
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(p) => p.id}
          onRowClick={(p) => openEdit(p)}
          pagination={{ page, totalPages, total, pageSize, onPageChange: setPage }}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar presupuesto ${editing.number}` : 'Nuevo presupuesto'}
        onClose={() => { setModalOpen(false); setEditing(null); resetErrors() }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              {editing && (clientsUnavailable || isFrozen) ? (
                <>
                  <input type="hidden" name="client_id" value={editing.client_id} />
                  <label className={labelCls}>Cliente *</label>
                  <input
                    value={editing.client_name ?? `Cliente ${editing.client_id}`}
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
              {editing && (vehiclesUnavailable || isFrozen) ? (
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
              {editing && (vehiclesUnavailable || isFrozen) ? (
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
                  disabled={isFrozen}
                  className={`${inputCls} w-full`}
                />
                <FieldError message={fieldErrors.mileage} />
              </div>
            )}
            <div>
              <label className={labelCls}>Estado</label>
              {isFrozen ? (
                <input
                  value={statusLabels[editing!.status] ?? editing!.status}
                  disabled
                  className={`${inputCls} w-full opacity-70`}
                />
              ) : (
                <select name="status" defaultValue={editing?.status ?? 'pendiente'} className={`${inputCls} w-full`}>
                  {Object.entries(statusLabels)
                    .filter(([value]) => value !== 'convertido')
                    .map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                </select>
              )}
            </div>
            <div>
              <label className={labelCls}>Validez (días)</label>
              <input name="validity_days" type="number" min={1} defaultValue={editing?.validity_days ?? 30} disabled={isFrozen} className={`${inputCls} w-full`} />
            </div>
            <div className="col-span-2">
              <FormTextarea
                name="description"
                label="Descripción"
                rows={3}
                disabled={isFrozen}
                defaultValue={editing?.description ?? ''}
              />
            </div>
            <div className="col-span-2">
              <FormTextarea
                name="notes"
                label="Observaciones"
                rows={3}
                disabled={isFrozen}
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
              disabled={isFrozen}
            />
            <p className="mt-2 text-sm text-slate-600">
              Total estimado: <strong>{itemTotal(items).toFixed(2)} €</strong>
            </p>
          </div>

          <div className="flex justify-between">
            {editing && (
              <div className="flex gap-2">
                {can('quotes.view') && (
                  <button type="button" onClick={() => window.open(`/quotes/${editing.id}/print`, '_blank')} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    Imprimir
                  </button>
                )}
                {can('quotes.delete') && editing.status !== 'convertido' && (
                  <button type="button" onClick={() => setPendingDelete(true)} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Eliminar
                  </button>
                )}
                {can('quotes.edit') && editing.status === 'pendiente' && (
                  <button type="button" onClick={() => statusMutation.mutate({ id: editing.id, status: 'aprobado' })} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
                    Aprobar
                  </button>
                )}
                {can('quotes.convert') && editing.status === 'aprobado' && (
                  <button type="button" onClick={() => convertMutation.mutate(editing.id)} className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">
                    Convertir en orden
                  </button>
                )}
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={btnGhost}>
                Cancelar
              </button>
              {!isFrozen && (
                <button type="submit" disabled={isPending} className={btnSuccess}>
                  {isPending ? 'Guardando…' : 'Guardar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el presupuesto "${editing?.number}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { if (editing) { deleteMutation.mutate(editing.id); setPendingDelete(false); setModalOpen(false); setEditing(null) } }}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  )
}
