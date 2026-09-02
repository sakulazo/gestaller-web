// Inventario de productos (CRUD).

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { FormInput, FieldError } from '../components/Form'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useFormMutation } from '../hooks/useFormMutation'
import SearchSelect from '../components/SearchSelect'
import { btnGhost, btnPrimary, btnSuccess, inputCls, labelCls } from '../components/ui'
import {
  createInventory,
  deleteInventory,
  listInventory,
  listProducts,
  updateInventory,
} from '../services'
import { inventorySchema } from '../lib/validation'
import type { Inventory, InventoryInput } from '../types'

const columns: Column<Inventory>[] = [
  { key: 'product_id', header: 'Producto ID' },
  { key: 'quantity', header: 'Cantidad' },
  { key: 'min_quantity', header: 'Mínimo' },
  { key: 'location', header: 'Ubicación' },
]

export default function Inventario() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Inventory | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [productId, setProductId] = useState('')

  const query = useQuery({ queryKey: ['inventory'], queryFn: listInventory })
  const productsQuery = useQuery({ queryKey: ['products'], queryFn: listProducts })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['inventory'] })

  const deleteMutation = useMutation({
    mutationFn: deleteInventory,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Inventory, InventoryInput>({
    mutationFn: (payload) =>
      editing ? updateInventory(editing.id, payload) : createInventory(payload),
    schema: inventorySchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Inventario actualizado correctamente' : 'Inventario creado correctamente')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const location = String(form.get('location') ?? '').trim()
    saveMutate({
      product_id: Number(form.get('product_id')),
      quantity: Number(form.get('quantity') ?? 0),
      min_quantity: Number(form.get('min_quantity') ?? 0),
      location: location || null,
    })
  }

  const openCreate = () => {
    setEditing(null)
    setProductId('')
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (i: Inventory) => {
    setEditing(i)
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
        {can('inventory.edit') && (
          <button onClick={openCreate} className={btnPrimary}>
            Nuevo registro
          </button>
        )}
      </div>

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={query.data ?? []}
          rowKey={(i) => i.id}
          onRowClick={(i) => openEdit(i)}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? 'Editar inventario' : 'Nuevo registro de inventario'}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          resetErrors()
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Producto *</label>
            {editing && productsQuery.isError ? (
              <>
                <input type="hidden" name="product_id" value={editing.product_id} />
                <input
                  value={`Producto ${editing.product_id}`}
                  disabled
                  className={`${inputCls} w-full opacity-70`}
                />
              </>
            ) : (
              <SearchSelect
                name="product_id"
                required
                disabled={Boolean(editing)}
                placeholder="Selecciona producto…"
                options={(productsQuery.data ?? []).map((p) => ({
                  value: String(p.id),
                  label: p.name,
                }))}
                value={editing ? String(editing.product_id) : productId}
                onChange={setProductId}
              />
            )}
            <FieldError message={fieldErrors.product_id} />
          </div>
          <FormInput
            name="quantity"
            label="Cantidad"
            type="number"
            min={0}
            defaultValue={editing?.quantity ?? 0}
            error={fieldErrors.quantity}
          />
          <FormInput
            name="min_quantity"
            label="Mínimo"
            type="number"
            min={0}
            defaultValue={editing?.min_quantity ?? 0}
            error={fieldErrors.min_quantity}
          />
          <div className="col-span-2">
            <FormInput
              name="location"
              label="Ubicación"
              defaultValue={editing?.location ?? ''}
              error={fieldErrors.location}
            />
          </div>
          <div className="col-span-2 flex justify-between">
            {editing && can('inventory.edit') && (
              <button type="button" onClick={() => setPendingDelete(true)} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                Eliminar
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className={btnGhost}>
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className={btnSuccess}>
                {isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete}
        title="Confirmar eliminación"
        message="¿Seguro que deseas eliminar este registro de inventario? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { if (editing) { deleteMutation.mutate(editing.id); setPendingDelete(false); setModalOpen(false); setEditing(null) } }}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  )
}
