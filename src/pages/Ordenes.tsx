// Órdenes de trabajo (creación con líneas, completar, editar estado).

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
  completeWorkOrder,
  createWorkOrder,
  deleteWorkOrder,
  listClients,
  listProducts,
  listServices,
  listUsers,
  listVehicleCategories,
  listVehicles,
  listWorkOrders,
  updateWorkOrder,
} from '../services'
import { workOrderSchema } from '../lib/validation'
import type { ItemInput, WorkOrder, WorkOrderInput, WorkOrderStatus } from '../types'

const statusLabels: Record<WorkOrderStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada',
  cancelada: 'Cancelada',
}

function vehicleLabel(v: { plate: string; make: string; model: string | null }) {
  return `${v.plate} — ${v.make} ${v.model ?? ''}`.trim()
}

export default function Ordenes() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<WorkOrder | null>(null)
  const [items, setItems] = useState<ItemInput[]>([])
  const [clientId, setClientId] = useState<number | null>(null)
  const [motorVehicleId, setMotorVehicleId] = useState('')
  const [trailerVehicleId, setTrailerVehicleId] = useState('')

  const query = useQuery({ queryKey: ['work-orders'], queryFn: listWorkOrders })
  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const vehiclesQuery = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const servicesQuery = useQuery({ queryKey: ['services'], queryFn: listServices })
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts })
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: listUsers })
  const categoriesQuery = useQuery({ queryKey: ['vehicle-categories'], queryFn: listVehicleCategories })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['work-orders'] })

  const deleteMutation = useMutation({
    mutationFn: deleteWorkOrder,
    onSuccess: invalidate,
  })
  const completeMutation = useMutation({
    mutationFn: completeWorkOrder,
    onSuccess: invalidate,
  })
  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<WorkOrder, WorkOrderInput>({
    mutationFn: (payload) =>
      editing ? updateWorkOrder(editing.id, payload) : createWorkOrder(payload),
    schema: workOrderSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      setItems([])
      toast.success(editing ? 'Orden actualizada correctamente' : 'Orden creada correctamente')
    },
  })

  const vehiclesOf = useMemo(
    () => (cid: number | null) =>
      cid == null
        ? vehiclesQuery.data ?? []
        : (vehiclesQuery.data ?? []).filter((v) => v.client_id === cid),
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

  const openCreate = () => {
    setEditing(null)
    setItems([])
    setClientId(null)
    setMotorVehicleId('')
    setTrailerVehicleId('')
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (o: WorkOrder) => {
    setEditing(o)
    setItems(o.items.map(({ id: _id, ...rest }) => rest))
    setClientId(o.client_id)
    setMotorVehicleId(o.motor_vehicle_id ? String(o.motor_vehicle_id) : '')
    setTrailerVehicleId(o.trailer_vehicle_id ? String(o.trailer_vehicle_id) : '')
    resetErrors()
    setModalOpen(true)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: WorkOrderInput = {
      client_id: Number(form.get('client_id')),
      motor_vehicle_id: form.get('motor_vehicle_id') ? Number(form.get('motor_vehicle_id')) : null,
      trailer_vehicle_id: form.get('trailer_vehicle_id') ? Number(form.get('trailer_vehicle_id')) : null,
      mileage: form.get('mileage') ? Number(form.get('mileage')) : null,
      status: (form.get('status') as WorkOrderStatus) ?? 'pendiente',
      description: String(form.get('description') ?? '').trim() || null,
      notes: String(form.get('notes') ?? '').trim() || null,
      items,
    }
    saveMutate(payload)
  }

  const columns: Column<WorkOrder>[] = [
    { key: 'number', header: 'Número' },
    { key: 'client_id', header: 'Cliente ID' },
    {
      key: 'motor_vehicle_id',
      header: 'Vehículo a motor',
      render: (o) => o.motor_vehicle ? vehicleLabel(o.motor_vehicle) : '—',
    },
    {
      key: 'trailer_vehicle_id',
      header: 'Remolque',
      render: (o) => o.trailer_vehicle ? vehicleLabel(o.trailer_vehicle) : '—',
    },
    {
      key: 'mileage',
      header: 'Kilometraje',
      render: (o) => o.mileage != null ? `${o.mileage.toLocaleString('es-ES')} km` : '—',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (o) => statusLabels[o.status] ?? o.status,
    },
    { key: 'description', header: 'Descripción' },
    {
      key: 'total',
      header: 'Total',
      render: (o) => `${Number(o.total).toFixed(2)} €`,
    },
  ]

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Órdenes de trabajo</h1>
        {can('work_orders.create') && (
          <button onClick={openCreate} className={btnPrimary}>
            Nueva orden
          </button>
        )}
      </div>

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={query.data ?? []}
          rowKey={(o) => o.id}
          onDelete={(o) => deleteMutation.mutate(o.id)}
          onEdit={openEdit}
          editPermission="work_orders.edit"
          deletePermission="work_orders.delete"
          renderActions={(o) =>
            can('work_orders.complete') &&
            (o.status === 'pendiente' || o.status === 'en_progreso') ? (
              <button
                onClick={() => completeMutation.mutate(o.id)}
                className="mr-3 text-emerald-600 hover:text-emerald-800"
              >
                Completar
              </button>
            ) : null
          }
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar orden ${editing.number}` : 'Nueva orden'}
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
            <div>
              <label className={labelCls}>Kilometraje</label>
              <input
                name="mileage"
                type="number"
                min={0}
                defaultValue={editing?.mileage ?? ''}
                placeholder="km"
                required={!!motorVehicleId}
                className={`${inputCls} w-full`}
              />
              <FieldError message={fieldErrors.mileage} />
            </div>
            <div>
              <label className={labelCls}>Estado</label>
              <select name="status" defaultValue={editing?.status ?? 'pendiente'} className={`${inputCls} w-full`}>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <FormTextarea
                name="description"
                label="Descripción"
                rows={3}
                defaultValue={editing?.description ?? ''}
              />
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
              users={usersQuery.data}
            />
            <p className="mt-2 text-sm text-slate-600">
              Total estimado: <strong>{itemTotal(items).toFixed(2)} €</strong>
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
