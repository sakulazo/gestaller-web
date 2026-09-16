// Órdenes de trabajo (creación con líneas, acciones de ciclo de vida).

import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import DataTable, { type Column } from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import InvoiceFormModal from '../components/InvoiceFormModal'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'
import SearchSelect from '../components/SearchSelect'
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { btnGhost, btnPrimary, btnSuccess, inputCls, labelCls } from '../components/ui'
import Checkbox from '../components/Checkbox'
import { FieldError, FormTextarea } from '../components/Form'
import { useToast } from '../components/Toast'
import { useFormMutation } from '../hooks/useFormMutation'
import OrdenItems from './OrdenItems'
import {
  cancelWorkOrder,
  checkInWorkOrder,
  createWorkOrder,
  deliverWorkOrder,
  getWorkOrder,
  listClients,
  listVehicleCategories,
  listVehicles,
  listWorkOrders,
  reactivateWorkOrder,
  updateWorkOrder,
} from '../services'
import { workOrderSchema } from '../lib/validation'
import type { WorkOrder, WorkOrderInput, WorkOrderStatus } from '../types'

export const statusLabels: Record<WorkOrderStatus, string> = {
  abierta: 'Abierta',
  en_progreso: 'En progreso',
  completada: 'Completada',
  entregada: 'Entregada',
  cancelada: 'Cancelada',
}

export const statusColors: Record<WorkOrderStatus, string> = {
  abierta: 'bg-slate-100 text-slate-700',
  en_progreso: 'bg-blue-100 text-blue-700',
  completada: 'bg-emerald-100 text-emerald-700',
  entregada: 'bg-purple-100 text-purple-700',
  cancelada: 'bg-red-100 text-red-700',
}

function vehicleLabel(v: { plate: string; make: string; model: string | null }) {
  return `${v.plate} — ${v.make} ${v.model ?? ''}`.trim()
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function Ordenes() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [itemsModalOpen, setItemsModalOpen] = useState(false)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [editing, setEditing] = useState<WorkOrder | null>(null)
  const [clientId, setClientId] = useState<number | null>(null)
  const [motorVehicleId, setMotorVehicleId] = useState('')
  const [trailerVehicleId, setTrailerVehicleId] = useState('')
  const [checkInOnCreate, setCheckInOnCreate] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<WorkOrder | null>(null)

  const { items, total, page, totalPages, pageSize, setPage, isLoading } =
    usePaginatedQuery<WorkOrder>(['work-orders'], listWorkOrders)
  const allOrdersQuery = useQuery({
    queryKey: ['work-orders', 'all'],
    queryFn: () => listWorkOrders({ all: true }).then((r) => r.items),
  })
  const editingOrderQuery = useQuery({
    queryKey: ['work-order', editing?.id],
    queryFn: () => getWorkOrder(editing!.id),
    enabled: editing != null,
  })
  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => listClients({ all: true }).then((r) => r.items),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles({ all: true }).then((r) => r.items),
  })
  const categoriesQuery = useQuery({
    queryKey: ['vehicle-categories'],
    queryFn: () => listVehicleCategories({ all: true }).then((r) => r.items),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['work-orders'] })

  const checkInMutation = useMutation({
    mutationFn: checkInWorkOrder,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success('Vehículo ingresado al taller')
    },
  })
  const deliverMutation = useMutation({
    mutationFn: deliverWorkOrder,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success('Vehículo entregado al cliente')
    },
  })
  const cancelOrderMutation = useMutation({
    mutationFn: cancelWorkOrder,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success('Orden cancelada')
    },
  })
  const reactivateMutation = useMutation({
    mutationFn: reactivateWorkOrder,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success('Orden reactivada')
    },
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<WorkOrder, WorkOrderInput>({
    mutationFn: (payload) =>
      editing ? updateWorkOrder(editing.id, payload) : createWorkOrder(payload),
    schema: workOrderSchema,
    onSuccess: (data) => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Orden actualizada correctamente' : 'Orden creada correctamente')
      if (!editing && checkInOnCreate) {
        checkInWorkOrder(data.id).then(() => invalidate())
      }
    },
  })

  const vehiclesOf = useMemo(
    () => (cid: number | null) =>
      cid == null ? [] : (vehiclesQuery.data ?? []).filter((v) => v.client_id === cid),
    [vehiclesQuery.data],
  )

  const categoryMap = useMemo(() => {
    const m = new Map<number, boolean>()
    for (const c of categoriesQuery.data ?? []) m.set(c.id, c.is_self_propelled)
    return m
  }, [categoriesQuery.data])

  const motorVehiclesOf = useMemo(
    () => (cid: number | null) =>
      vehiclesOf(cid).filter((v) => v.category_id != null && categoryMap.get(v.category_id) === true),
    [vehiclesOf, categoryMap],
  )

  const trailerVehiclesOf = useMemo(
    () => (cid: number | null) =>
      vehiclesOf(cid).filter((v) => v.category_id != null && categoryMap.get(v.category_id) === false),
    [vehiclesOf, categoryMap],
  )

  const clientsUnavailable = clientsQuery.isError
  const vehiclesUnavailable = vehiclesQuery.isError

  const activeVehicleIds = useMemo(() => {
    const ids = new Set<number>()
    for (const o of allOrdersQuery.data ?? []) {
      if (o.motor_vehicle_id != null) ids.add(o.motor_vehicle_id)
      if (o.trailer_vehicle_id != null) ids.add(o.trailer_vehicle_id)
    }
    if (editing) {
      if (editing.motor_vehicle_id != null) ids.delete(editing.motor_vehicle_id)
      if (editing.trailer_vehicle_id != null) ids.delete(editing.trailer_vehicle_id)
    }
    return ids
  }, [allOrdersQuery.data, editing])

  const selectedVehicleInWorkshop =
    (motorVehicleId && activeVehicleIds.has(Number(motorVehicleId))) ||
    (trailerVehicleId && activeVehicleIds.has(Number(trailerVehicleId)))

  const openCreate = () => {
    setEditing(null)
    setClientId(null)
    setMotorVehicleId('')
    setTrailerVehicleId('')
    setCheckInOnCreate(false)
    setItemsModalOpen(false)
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (o: WorkOrder) => {
    setEditing(o)
    setClientId(o.client_id)
    setMotorVehicleId(o.motor_vehicle_id ? String(o.motor_vehicle_id) : '')
    setTrailerVehicleId(o.trailer_vehicle_id ? String(o.trailer_vehicle_id) : '')
    setItemsModalOpen(false)
    resetErrors()
    setModalOpen(true)
  }

  const liveOrder = editingOrderQuery.data ?? editing
  const liveStatus = liveOrder?.derived_status ?? ''
  const isReadOnly = editing != null && (liveStatus === 'cancelada' || liveOrder?.invoiced_at != null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: WorkOrderInput = {
      client_id: Number(form.get('client_id')),
      motor_vehicle_id: form.get('motor_vehicle_id') ? Number(form.get('motor_vehicle_id')) : null,
      trailer_vehicle_id: form.get('trailer_vehicle_id') ? Number(form.get('trailer_vehicle_id')) : null,
      mileage: form.get('mileage') ? Number(form.get('mileage')) : null,
      description: String(form.get('description') ?? '').trim(),
      notes: String(form.get('notes') ?? '').trim() || null,
    }
    saveMutate(payload)
  }

  const columns: Column<WorkOrder>[] = [
    { key: 'number', header: 'Código', align: 'center', render: (o) => <div className="text-center">{o.number}</div> },
    {
      key: 'opened_at',
      header: 'Fecha',
      align: 'center',
      render: (o) => <div className="text-center">{formatDate(o.opened_at)}</div>,
    },
    {
      key: 'motor_vehicle_id',
      header: 'Vehículo',
      align: 'center',
      render: (o) => <div className="text-center">{o.motor_vehicle?.plate ?? '—'}</div>,
    },
    {
      key: 'trailer_vehicle_id',
      header: 'Remolque',
      align: 'center',
      render: (o) => <div className="text-center">{o.trailer_vehicle?.plate ?? '—'}</div>,
    },
    {
      key: 'mileage',
      header: 'Kms',
      align: 'center',
      render: (o) => (
        <div className="text-center">{o.mileage != null ? `${o.mileage.toLocaleString('es-ES')} km` : '—'}</div>
      ),
    },
    {
      key: 'client_id',
      header: 'Cliente',
      align: 'center',
      render: (o) => o.client_name ?? `Cliente ${o.client_id}`,
    },
    { key: 'description', header: 'Descripción' },
    {
      key: 'derived_status',
      header: 'Estado',
      align: 'center',
      render: (o) => (
        <div className="flex items-center justify-center gap-1">
          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[o.derived_status] ?? 'bg-slate-100 text-slate-600'}`}>
            {statusLabels[o.derived_status] ?? o.derived_status}
          </span>
          {o.invoiced_at && (
            <span className="inline-block whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Facturada
            </span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Órdenes de trabajo</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/work-orders/history')} className={btnGhost}>
            Histórico
          </button>
          {can('work_orders.create') && (
            <button onClick={openCreate} className={btnPrimary}>
              Nueva orden
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(o) => o.id}
          onRowClick={(o) => openEdit(o)}
          pagination={{ page, totalPages, total, pageSize, onPageChange: setPage }}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Seguimiento de orden ${editing.number}` : 'Nueva orden'}
        onClose={() => { setModalOpen(false); setEditing(null); resetErrors() }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {selectedVehicleInWorkshop && (
            <div className="rounded border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-700">
              El vehículo seleccionado ya está asignado a otra orden activa en el taller.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              {editing && (clientsUnavailable || isReadOnly) ? (
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
                    value={clientId?.toString() ?? ''}
                    onChange={(v) => {
                      const cid = v ? Number(v) : null
                      setClientId(cid)
                      if (
                        motorVehicleId &&
                        !motorVehiclesOf(cid).some((veh) => String(veh.id) === motorVehicleId)
                      ) {
                        setMotorVehicleId('')
                      }
                      if (
                        trailerVehicleId &&
                        !trailerVehiclesOf(cid).some((veh) => String(veh.id) === trailerVehicleId)
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
              {editing && (vehiclesUnavailable || isReadOnly) ? (
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
                    disabled={!clientId}
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
              {editing && (vehiclesUnavailable || isReadOnly) ? (
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
                    disabled={!clientId}
                    options={trailerVehiclesOf(clientId).map((v) => ({
                      value: String(v.id),
                      label: vehicleLabel(v),
                    }))}
                    value={trailerVehicleId}
                    onChange={setTrailerVehicleId}
                  />
                  <FieldError message={fieldErrors.trailer_vehicle_id} />
                </>
              )}
            </div>
            <div>
              <label className={labelCls}>Kilometraje</label>
              <input
                name="mileage"
                type="number"
                min={0}
                defaultValue={editing?.mileage ?? ''}
                placeholder="km"
                required={!!motorVehicleId}
                disabled={isReadOnly}
                className={`${inputCls} w-full`}
              />
              <FieldError message={fieldErrors.mileage} />
            </div>
            <div className="col-span-2">
              <FormTextarea
                name="description"
                label="Descripción"
                rows={3}
                required
                disabled={isReadOnly}
                defaultValue={editing?.description ?? ''}
                error={fieldErrors.description}
              />
            </div>
            <div className="col-span-2">
              <FormTextarea
                name="notes"
                label="Observaciones"
                rows={3}
                disabled={isReadOnly}
                defaultValue={editing?.notes ?? ''}
                error={fieldErrors.notes}
              />
            </div>
            {!editing && (
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Checkbox
                    checked={checkInOnCreate}
                    onChange={(e) => setCheckInOnCreate(e.target.checked)}
                  />
                  Ingresar vehículo al taller
                </div>
              </div>
            )}
          </div>

          {editing && (
            <div className="flex items-center justify-between rounded border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm text-slate-600">
                  <strong>{editingOrderQuery.data?.items.length ?? editing.items.length}</strong>{' '}
                  {(editingOrderQuery.data?.items.length ?? editing.items.length) === 1 ? 'línea' : 'líneas'} · Tiempo:{' '}
                  <strong>{editingOrderQuery.data?.total ?? editing.total} min</strong>
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  Las líneas se gestionan desde su página propia.
                </p>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setItemsModalOpen(true)}
                  className={btnPrimary}
                >
                  Gestionar líneas
                </button>
              )}
            </div>
          )}

          <div className="flex justify-between">
            {editing && (
              <div className="flex gap-2">
                {can('work_orders.check_in') && liveStatus === 'abierta' && (
                  <button type="button" onClick={() => checkInMutation.mutate(editing.id)} className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500">
                    Ingresar vehículo/s
                  </button>
                )}
                {can('work_orders.view') && liveOrder?.checked_in_at && (
                  <button
                    type="button"
                    onClick={() => window.open(`/work-orders/${editing.id}/check-in`, '_blank')}
                    className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Imprimir resguardo
                  </button>
                )}
                {can('work_orders.deliver') && (liveStatus === 'completada' || liveStatus === 'cancelada') && (
                  <button type="button" onClick={() => deliverMutation.mutate(editing.id)} className="rounded bg-purple-600 px-4 py-2 text-sm text-white hover:bg-purple-500">
                    Entregar vehículo/s
                  </button>
                )}
                {can('invoices.create') && liveStatus === 'entregada' && (
                  <button
                    type="button"
                    onClick={() => setInvoiceModalOpen(true)}
                    className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500"
                  >
                    Facturar
                  </button>
                )}
                {can('work_orders.cancel') && (liveStatus === 'abierta' || liveStatus === 'en_progreso') && (
                  <button type="button" onClick={() => setCancelTarget(editing)} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    Cancelar orden
                  </button>
                )}
                {can('work_orders.reactivate') && liveStatus === 'cancelada' && (
                  <button type="button" onClick={() => reactivateMutation.mutate(editing.id)} className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500">
                    Reactivar
                  </button>
                )}
              </div>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={btnGhost}>
                Cerrar
              </button>
              {!isReadOnly && (
                <button type="submit" disabled={isPending} className={btnSuccess}>
                  {isPending ? 'Guardando…' : 'Guardar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>

      {editing && (
        <Modal
          open={itemsModalOpen}
          stacked
          wide
          title={`Líneas de la orden ${editing.number}`}
          onClose={() => setItemsModalOpen(false)}
        >
          <OrdenItems
            workOrderId={editing.id}
            embedded
            onClose={() => setItemsModalOpen(false)}
          />
        </Modal>
      )}

      <InvoiceFormModal
        open={invoiceModalOpen}
        prefillWorkOrder={editing}
        onClose={() => setInvoiceModalOpen(false)}
        onCreated={() => {
          setInvoiceModalOpen(false)
          setModalOpen(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancelar orden"
        message={<>{cancelTarget && <>¿Cancelar la orden <strong>{cancelTarget.number}</strong>? Los ítems no se modificarán.</>}</>}
        confirmLabel="Cancelar orden"
        danger
        onConfirm={() => {
          if (cancelTarget) {
            cancelOrderMutation.mutate(cancelTarget.id)
            setCancelTarget(null)
          }
        }}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
