// Productos (catálogo de productos, CRUD).

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { FieldError, FormInput } from '../components/Form'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useFormMutation } from '../hooks/useFormMutation'
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import SearchSelect from '../components/SearchSelect'
import { btnGhost, btnPrimary, btnSuccess, labelCls } from '../components/ui'
import {
  createProduct,
  deleteProduct,
  listProductCategories,
  listProducts,
  listProviders,
  updateProduct,
} from '../services'
import { productSchema } from '../lib/validation'
import type { Product, ProductInput } from '../types'

const baseColumns: Column<Product>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'brand', header: 'Marca' },
  { key: 'category_id', header: 'Categoría' },
  {
    key: 'price',
    header: 'Precio',
    render: (r) => `${Number(r.price).toFixed(2)} €`,
  },
]

export default function Productos() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [categoryId, setCategoryId] = useState('')

  const { items, total, page, totalPages, pageSize, setPage, isLoading } =
    usePaginatedQuery<Product>(['products'], listProducts)
  const categoriesQuery = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => listProductCategories({ all: true }).then((r) => r.items),
  })
  const providersQuery = useQuery({
    queryKey: ['providers'],
    queryFn: () => listProviders({ all: true }).then((r) => r.items),
  })

  const columns = baseColumns.map((c) =>
    c.key === 'category_id'
      ? {
          ...c,
          render: (r: Product) =>
            categoriesQuery.data?.find((cat) => cat.id === r.category_id)?.name ?? '—',
        }
      : c,
  )

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['products'] })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Product, ProductInput>({
    mutationFn: (payload) =>
      editing ? updateProduct(editing.id, payload) : createProduct(payload),
    schema: productSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Producto actualizado correctamente' : 'Producto creado correctamente')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const str = (name: string) => {
      const v = String(form.get(name) ?? '').trim()
      return v || null
    }
    saveMutate({
      name: String(form.get('name') ?? ''),
      description: str('description'),
      brand: str('brand'),
      category_id: Number(form.get('category_id')),
      price: Number(form.get('price') ?? 0),
      provider_ids: form.getAll('provider_ids').map((v) => Number(v)),
    })
  }

  const openCreate = () => {
    setEditing(null)
    setCategoryId('')
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (r: Product) => {
    setEditing(r)
    setCategoryId(String(r.category_id))
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Productos</h1>
        <div className="flex gap-2">
          {can('product_categories.view') && (
            <button onClick={() => navigate('/product-categories')} className={btnGhost}>
              Gestionar categorías
            </button>
          )}
          {can('products.create') && (
            <button onClick={openCreate} className={btnPrimary}>
              Nuevo producto
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
          rowKey={(r) => r.id}
          onRowClick={(r) => openEdit(r)}
          pagination={{ page, totalPages, total, pageSize, onPageChange: setPage }}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar producto ${editing.name}` : 'Nuevo producto'}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          resetErrors()
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-4">
          <FormInput
            name="name"
            label="Nombre"
            required
            defaultValue={editing?.name ?? ''}
            error={fieldErrors.name}
          />
          <div>
            <label className={labelCls}>Categoría *</label>
            <SearchSelect
              name="category_id"
              required
              placeholder="Selecciona categoría…"
              options={(categoriesQuery.data ?? []).map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              value={categoryId}
              onChange={setCategoryId}
            />
            <FieldError message={fieldErrors.category_id} />
          </div>
          <FormInput
            name="brand"
            label="Marca"
            defaultValue={editing?.brand ?? ''}
            error={fieldErrors.brand}
          />
          <div className="col-span-2">
            <FormInput
              name="description"
              label="Descripción"
              defaultValue={editing?.description ?? ''}
              error={fieldErrors.description}
            />
          </div>
          <FormInput
            name="price"
            label="Precio (€)"
            type="number"
            step="0.01"
            min={0}
            defaultValue={editing?.price ?? 0}
            error={fieldErrors.price}
          />
          <div className="col-span-2">
            <label className={labelCls}>Proveedores</label>
            <div className="max-h-32 overflow-y-auto rounded border border-slate-200 p-2">
              {providersQuery.data?.map((p) => (
                <label key={p.id} className="flex items-center gap-2 py-0.5 text-sm text-slate-600">
                  <input
                    name="provider_ids"
                    type="checkbox"
                    value={p.id}
                    defaultChecked={editing?.provider_ids?.includes(p.id)}
                    className="h-4 w-4"
                  />
                  {p.name}
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2 flex justify-between">
            {editing && can('products.delete') && (
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
        message={`¿Seguro que deseas eliminar el producto "${editing?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { if (editing) { deleteMutation.mutate(editing.id); setPendingDelete(false); setModalOpen(false); setEditing(null) } }}
        onCancel={() => setPendingDelete(false)}
      />
    </div>
  )
}
