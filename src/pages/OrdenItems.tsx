// Gestión de líneas (items) de una orden de trabajo.
// Al contrario que en la creación (que envía ítems inline con la orden),
// aquí cada alta/edición/borrado persiste al momento vía /work-orders/{id}/items.
// Se usa tanto en página propia (/work-orders/:id/items) como embebido en un
// modal apilado sobre el modal de la orden (embedded).

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import SearchSelect from '../components/SearchSelect'
import { btnGhost, inputCls } from '../components/ui'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import {
  cancelWorkOrderItem,
  completeWorkOrderItem,
  createWorkOrderItem,
  deleteWorkOrderItem,
  getWorkOrder,
  getWorkOrderItems,
  listProducts,
  listServices,
  listUsers,
  updateWorkOrderItem,
} from '../services'
import { statusColors as orderStatusColors, statusLabels as orderStatusLabels } from './Ordenes'
import type {
  ItemInput,
  ItemType,
  Product,
  Service,
  User,
  WorkOrderItem,
  WorkOrderItemStatus,
} from '../types'

const itemStatusLabels: Record<WorkOrderItemStatus, string> = {
  pendiente: 'Pendiente',
  asignado: 'Asignado',
  completado: 'Completado',
  cancelado: 'Cancelado',
  producto: 'Producto',
}

const itemStatusColors: Record<WorkOrderItemStatus, string> = {
  pendiente: 'bg-slate-100 text-slate-700',
  asignado: 'bg-blue-100 text-blue-700',
  completado: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
  producto: 'bg-slate-100 text-slate-700',
}

function toNumber(value: FormDataEntryValue | null): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const newItem = (item_type: ItemType): ItemInput => ({
  item_type,
  service_id: null,
  product_id: null,
  assigned_to: null,
  description: '',
  quantity: 1,
  unit_price: 0,
  discount: 0,
  duration_minutes: null,
  tax_rate_id: null,
})

const toInput = (it: WorkOrderItem): ItemInput => ({
  item_type: it.item_type,
  service_id: it.service_id,
  product_id: it.product_id,
  assigned_to: it.assigned_to,
  description: it.description ?? '',
  quantity: it.quantity,
  unit_price: it.unit_price,
  discount: it.discount,
  duration_minutes: it.duration_minutes,
  tax_rate_id: null,
})

interface ItemRowEditorProps {
  item: ItemInput
  services?: Service[]
  products?: Product[]
  users?: User[]
  saving: boolean
  pickReference: boolean
  onChange: (patch: Partial<ItemInput>) => void
  onSave: () => void
  onCancel: () => void
  saveLabel?: string
}

function ItemRowEditor({
  item,
  services,
  products,
  users,
  saving,
  pickReference,
  onChange,
  onSave,
  onCancel,
  saveLabel = 'Guardar',
}: ItemRowEditorProps) {
  const isService = item.item_type === 'service'
  const options = isService ? services : products
  const refValue = isService
    ? item.service_id?.toString() ?? ''
    : item.product_id?.toString() ?? ''
  const refReady = isService ? item.service_id != null : item.product_id != null

  const selectRef = (v: string) => {
    const id = v ? Number(v) : null
    const found = (isService ? services : products)?.find((r) => r.id === id)
    onChange({
      [isService ? 'service_id' : 'product_id']: id,
      description: found ? found.name : '',
      unit_price: found ? Number(found.price) : 0,
      duration_minutes:
        isService && found ? Number((found as Service).duration_minutes ?? 0) || null : null,
    })
  }

  return (
    <tr className="h-16 bg-slate-50">
      <td className="w-[4.5rem] px-2 py-3 text-center text-xs font-medium text-slate-500">
        {isService ? 'Servicio' : 'Producto'}
      </td>
      <td className="w-[17rem] overflow-visible px-3 py-3">
        {pickReference ? (
          <SearchSelect
            required
            placeholder={isService ? 'Selecciona servicio…' : 'Selecciona producto…'}
            options={(options ?? []).map((r) => ({
              value: String(r.id),
              label: r.name,
            }))}
            value={refValue}
            onChange={selectRef}
          />
        ) : (
          <input
            type="text"
            className={`${inputCls} w-full`}
            value={item.description ?? ''}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        )}
      </td>
      <td className="w-40 overflow-visible px-3 py-3 text-center">
        {isService ? (
          <SearchSelect
            placeholder="Sin asignar"
            options={(users ?? []).map((u) => ({
              value: String(u.id),
              label: u.name,
            }))}
            value={item.assigned_to?.toString() ?? ''}
            onChange={(v) => onChange({ assigned_to: v ? Number(v) : null })}
          />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="w-20 px-3 py-3 text-center">
        <input
          type="number"
          min={1}
          className={`${inputCls} w-full`}
          value={item.quantity}
          onChange={(e) => onChange({ quantity: Math.max(1, toNumber(e.target.value)) })}
        />
      </td>
      <td className="w-24 px-3 py-3 text-center">
        {isService ? (
          <input
            type="number"
            min={0}
            className={`${inputCls} w-full`}
            value={item.duration_minutes ?? ''}
            placeholder="min"
            onChange={(e) => onChange({ duration_minutes: e.target.value ? Math.max(0, toNumber(e.target.value)) : null })}
          />
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="w-28 px-3 py-3 text-center text-xs text-slate-400">—</td>
      <td className="w-[13rem] px-3 py-3">
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || (pickReference && !refReady)}
            className="rounded bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {saving ? 'Guardando…' : saveLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-slate-300 px-3 py-1 text-xs text-slate-600 hover:bg-slate-100"
          >
            Cancelar
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function OrdenItems({
  workOrderId,
  embedded = false,
  onClose,
}: {
  workOrderId?: number
  embedded?: boolean
  onClose?: () => void
}) {
  const rawId = useParams().id
  const id = workOrderId ?? Number(rawId)
  const navigate = useNavigate()
  const { can, user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const close = () => (embedded ? onClose?.() : navigate('/work-orders'))

  const [adding, setAdding] = useState<ItemInput | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editing, setEditing] = useState<ItemInput | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WorkOrderItem | null>(null)

  const orderQuery = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => getWorkOrder(id),
    enabled: Number.isInteger(id),
  })
  const itemsQuery = useQuery({
    queryKey: ['work-order-items', id],
    queryFn: () => getWorkOrderItems(id),
    enabled: Number.isInteger(id),
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
  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers({ all: true }).then((r) => r.items),
    enabled: can('users.view'),
  })

  const order = orderQuery.data
  const items = itemsQuery.data ?? []
  const canModify =
    order?.invoiced_at == null &&
    (order?.derived_status === 'abierta' ||
      order?.derived_status === 'en_progreso' ||
      order?.derived_status === 'completada' ||
      order?.derived_status === 'entregada')

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['work-order-items', id] })
    queryClient.invalidateQueries({ queryKey: ['work-order', id] })
    queryClient.invalidateQueries({ queryKey: ['work-orders'] })
  }

  const createMutation = useMutation({
    mutationFn: (data: ItemInput) => createWorkOrderItem(id, data),
    onSuccess: () => {
      invalidate()
      setAdding(null)
      toast.success('Línea añadida')
    },
  })
  const editMutation = useMutation({
    mutationFn: (payload: { itemId: number; data: Partial<ItemInput> }) =>
      updateWorkOrderItem(id, payload.itemId, payload.data),
    onSuccess: () => {
      invalidate()
      setEditingId(null)
      setEditing(null)
      toast.success('Línea actualizada')
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => deleteWorkOrderItem(id, itemId),
    onSuccess: () => {
      invalidate()
      setDeleteTarget(null)
      toast.success('Línea eliminada')
    },
  })
  const completeMutation = useMutation({
    mutationFn: (itemId: number) => completeWorkOrderItem(id, itemId),
    onSuccess: () => {
      invalidate()
      toast.success('Línea completada')
    },
  })
  const cancelMutation = useMutation({
    mutationFn: (itemId: number) => cancelWorkOrderItem(id, itemId),
    onSuccess: () => {
      invalidate()
      toast.success('Línea cancelada')
    },
  })

  const total = items.reduce((acc, it) => acc + (it.duration_minutes ?? 0), 0)

  const startEdit = (it: WorkOrderItem) => {
    setEditingId(it.id)
    setEditing(toInput(it))
  }

  const saveNew = () => {
    if (adding) createMutation.mutate(adding)
  }

  const saveEdit = () => {
    if (editingId != null && editing) {
      editMutation.mutate({
        itemId: editingId,
        data: {
          description: editing.description,
          quantity: editing.quantity,
          unit_price: editing.unit_price,
          duration_minutes: editing.duration_minutes,
          assigned_to: editing.assigned_to,
        },
      })
    }
  }

  const canEditDoc = can('work_order_items.edit')
  const canCreate = can('work_order_items.create')
  const canDelete = can('work_order_items.delete')
  const canComplete = can('work_order_items.complete')
  const canCancel = can('work_order_items.cancel')

  // Usuarios scoped (sin work_orders.view_all) solo operan sobre sus ítems
  // (service asignado a ellos); los productos no tienen dueño y siempre se
  // gestionan desde la orden.
  const scoped = !can('work_orders.view_all')
  const canActOnItem = (it: WorkOrderItem) =>
    !scoped || it.item_type === 'product' || it.assigned_to === user?.id

  if (orderQuery.isLoading || itemsQuery.isLoading) {
    return <p className="text-slate-500">Cargando…</p>
  }

  if (!order) {
    return (
      <div>
        <p className="text-slate-500">Orden no encontrada.</p>
        <button type="button" onClick={close} className={`${btnGhost} mt-4`}>
          {embedded ? 'Cerrar' : 'Volver a órdenes'}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          {!embedded && (
            <h1 className="text-2xl font-bold text-slate-800">
              Líneas de la orden {order.number}
            </h1>
          )}
          <p className={`text-sm text-slate-500 ${embedded ? '' : 'mt-1'}`}>
            {order.client_name ?? `Cliente ${order.client_id}`}
            {' · '}
            {order.motor_plate ?? order.motor_vehicle?.plate ?? '—'}
            {order.trailer_plate ?? order.trailer_vehicle ? ` / ${order.trailer_plate ?? order.trailer_vehicle?.plate}` : ''}
            {' · '}
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                orderStatusColors[order.derived_status] ?? 'bg-slate-100 text-slate-600'
              }`}
            >
              {orderStatusLabels[order.derived_status] ?? order.derived_status}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-600">
            Tiempo total: <strong>{total} min</strong>
          </p>
          {!embedded && (
            <button type="button" onClick={close} className={btnGhost}>
              Volver a órdenes
            </button>
          )}
        </div>
      </div>

      {!canModify && (
        <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
          {order.invoiced_at
            ? 'Esta orden está facturada: sus líneas no se pueden modificar.'
            : 'Solo se pueden modificar líneas en órdenes abiertas, en progreso o completadas.'}
        </p>
      )}

      <div className="overflow-visible rounded bg-white shadow">
        <table className="min-w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-[4.5rem] px-4 py-2 text-center font-medium uppercase">Tipo</th>
              <th className="w-[17rem] px-4 py-2 text-center font-medium uppercase">Concepto</th>
              <th className="w-40 px-4 py-2 text-center font-medium uppercase">Asignado</th>
              <th className="w-20 px-4 py-2 text-center font-medium uppercase">Cant.</th>
              <th className="w-24 px-4 py-2 text-center font-medium uppercase">Tiempo</th>
              <th className="w-28 px-4 py-2 text-center font-medium uppercase">Estado</th>
              <th className="w-[13rem] px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((it) =>
              editingId === it.id && editing ? (
                <ItemRowEditor
                  key={`edit-${it.id}`}
                  item={editing}
                  services={servicesQuery.data}
                  products={productsQuery.data}
                  users={usersQuery.data}
                  saving={editMutation.isPending}
                  pickReference={false}
                  onChange={(patch) => setEditing({ ...editing, ...patch })}
                  onSave={saveEdit}
                  onCancel={() => {
                    setEditingId(null)
                    setEditing(null)
                  }}
                />
              ) : (
                <tr key={it.id} className="h-16">
                  <td className="w-[4.5rem] px-2 py-3 text-center text-xs font-medium text-slate-500">
                    {it.item_type === 'service' ? 'Servicio' : 'Producto'}
                  </td>
                  <td className="w-[17rem] px-3 py-3">{it.description || '—'}</td>
                  <td className="w-40 px-3 py-3 text-center">
                      {it.assigned_user_name ?? it.assigned_user?.name ?? (it.assigned_to != null ? `Usuario ${it.assigned_to}` : '—')}
                    </td>
                  <td className="w-20 px-3 py-3 text-center">{it.quantity}</td>
                  <td className="w-24 px-3 py-3 text-center">{it.duration_minutes != null ? `${it.duration_minutes} min` : '—'}</td>
                  <td className="w-28 px-3 py-3 text-center">
                    <span
                      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${
                        itemStatusColors[it.derived_status] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {itemStatusLabels[it.derived_status] ?? it.derived_status}
                    </span>
                  </td>
                  <td className="w-[13rem] px-3 py-3">
                    {canModify && canActOnItem(it) && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {canEditDoc && (
                          <button type="button" onClick={() => startEdit(it)} className="whitespace-nowrap rounded border border-slate-300 px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50">
                            Editar
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => setDeleteTarget(it)} className="whitespace-nowrap rounded border border-slate-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50">
                            Quitar
                          </button>
                        )}
                        {it.item_type === 'service' &&
                          (it.derived_status === 'pendiente' || it.derived_status === 'asignado') &&
                          canComplete && (
                            <button type="button" onClick={() => completeMutation.mutate(it.id)} className="whitespace-nowrap rounded border border-slate-300 px-2 py-0.5 text-xs text-emerald-600 hover:bg-emerald-50">
                              Completar
                            </button>
                          )}
                        {it.item_type === 'service' &&
                          (it.derived_status === 'pendiente' || it.derived_status === 'asignado') &&
                          canCancel && (
                            <button type="button" onClick={() => cancelMutation.mutate(it.id)} className="whitespace-nowrap rounded border border-slate-300 px-2 py-0.5 text-xs text-orange-600 hover:bg-orange-50">
                              Cancelar
                            </button>
                          )}
                      </div>
                    )}
                  </td>
                </tr>
              ),
            )}
            {adding && (
              <ItemRowEditor
                key="new"
                item={adding}
                services={servicesQuery.data}
                products={productsQuery.data}
                users={usersQuery.data}
                saving={createMutation.isPending}
                pickReference
                onChange={(patch) => setAdding({ ...adding, ...patch })}
                onSave={saveNew}
                onCancel={() => setAdding(null)}
                saveLabel="Añadir"
              />
            )}
            {items.length === 0 && !adding && (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-center text-slate-400">
                  Sin líneas de detalle
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {canModify && canCreate && (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setAdding(newItem('service'))} className={btnGhost}>
            + Añadir servicio
          </button>
          <button type="button" onClick={() => setAdding(newItem('product'))} className={btnGhost}>
            + Añadir producto
          </button>
        </div>
      )}

      {embedded && (
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={close} className={btnGhost}>
            Cerrar
          </button>
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Quitar línea"
        message={
          <>
            ¿Eliminar la línea <strong>{deleteTarget?.description || 'sin descripción'}</strong>?
            El tiempo total de la orden se recalculará.
          </>
        }
        confirmLabel="Quitar línea"
        danger
        stacked={embedded}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}