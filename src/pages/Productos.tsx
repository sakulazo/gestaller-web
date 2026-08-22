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
import SearchSelect from '../components/SearchSelect'
import { btnGhost, btnPrimary, btnSuccess, labelCls } from '../components/ui'
import {
  createProduct,
  deleteProduct,
  listProductCategories,
  listProducts,
  listProviders,
  updateProduct,
  restoreProduct,
} from '../services'
import { productSchema } from '../lib/validation'
import type { Product, ProductInput } from '../types'

const columns: Column<Product>[] = [
  { key: 'code', header: 'Código' },
  { key: 'name', header: 'Nombre' },
  { key: 'brand', header: 'Marca' },
  { key: 'category_id', header: 'Categoría ID' },
  {
    key: 'price',
    header: 'Precio',
    render: (r) => `${Number(r.price).toFixed(2)} €`,
  },
  { key: 'is_active', header: 'Activo', render: (r) => (r.is_active ? 'Sí' : 'No') },
]

export default function Productos() {
  const navigate = useNavigate()
  const { can, getPermissionsForRoute } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)
  const [categoryId, setCategoryId] = useState('')

  const query = useQuery({ queryKey: ['products'], queryFn: listProducts })
  const categoriesQuery = useQuery({
    queryKey: ['product-categories'],
    queryFn: listProductCategories,
  })
  const providersQuery = useQuery({ queryKey: ['providers'], queryFn: listProviders })

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
    onConflict: (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreProduct(id),
    onSuccess: () => {
      invalidate()
      setRestoreInfo(null)
      setModalOpen(false)
      setEditing(null)
      toast.success('Registro restaurado correctamente')
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
      code: String(form.get('code') ?? ''),
      name: String(form.get('name') ?? ''),
      description: str('description'),
      brand: str('brand'),
      category_id: Number(form.get('category_id')),
      price: Number(form.get('price') ?? 0),
      is_active: form.get('is_active') === 'on',
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
          {getPermissionsForRoute('/inventory').some(can) && (
            <button onClick={() => navigate('/inventory')} className={btnGhost}>
              Gestionar inventario
            </button>
          )}
          {can('products.create') && (
            <button onClick={openCreate} className={btnPrimary}>
              Nuevo producto
            </button>
          )}
        </div>
      </div>

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={query.data ?? []}
          rowKey={(r) => r.id}
          onDelete={(r) => deleteMutation.mutate(r.id)}
          onEdit={openEdit}
          editPermission="products.edit"
          deletePermission="products.delete"
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
            name="code"
            label="Código"
            required
            defaultValue={editing?.code ?? ''}
            error={fieldErrors.code}
          />
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
          <div className="flex items-end gap-4 pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input name="is_active" type="checkbox" defaultChecked={editing ? editing.is_active : true} className="h-4 w-4" />
              Activo
            </label>
          </div>
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
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setModalOpen(false)} className={btnGhost}>
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className={btnSuccess}>
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={restoreInfo !== null}
        title="Registro borrado encontrado"
        message={restoreInfo?.message ?? ''}
        confirmLabel="Restaurar"
        onConfirm={() => { if (restoreInfo) restoreMutation.mutate(restoreInfo.id) }}
        onCancel={() => setRestoreInfo(null)}
      />
    </div>
  )
}
