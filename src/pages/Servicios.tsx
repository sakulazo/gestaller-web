// Catálogo de servicios (CRUD).

import { useMemo, useState } from 'react'
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
  createService,
  deleteService,
  listServiceCategories,
  listServices,
  updateService,
  restoreService,
} from '../services'
import { serviceSchema } from '../lib/validation'
import type { Service, ServiceInput } from '../types'

export default function Servicios() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [categoryId, setCategoryId] = useState('')

  const { items, total, page, totalPages, pageSize, setPage, isLoading } =
    usePaginatedQuery<Service>(['services'], listServices)
  const categoriesQuery = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => listServiceCategories({ all: true }).then((r) => r.items),
  })

  const categoryMap = useMemo(() => {
    const map = new Map<number, string>()
    for (const c of categoriesQuery.data ?? []) map.set(c.id, c.name)
    return map
  }, [categoriesQuery.data])

  const columns: Column<Service>[] = useMemo(() => [
    { key: 'name', header: 'Nombre', align: 'left' },
    { key: 'description', header: 'Descripción', align: 'left' },
    {
      key: 'category_id',
      header: 'Categoría',
      align: 'center',
      render: (s) => categoryMap.get(s.category_id) ?? String(s.category_id),
    },
    {
      key: 'price',
      header: 'Precio',
      align: 'center',
      render: (s) => `${Number(s.price).toFixed(2)} €`,
    },
    { key: 'duration_minutes', header: 'Duración (min)', align: 'center' },
  ], [categoryMap])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['services'] })

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Service, ServiceInput>({
    mutationFn: (payload) =>
      editing ? updateService(editing.id, payload) : createService(payload),
    schema: serviceSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Servicio actualizado correctamente' : 'Servicio creado correctamente')
    },
    onConflict: (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreService(id),
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
    saveMutate({
      name: String(form.get('name') ?? ''),
      description: String(form.get('description') ?? ''),
      category_id: Number(form.get('category_id')),
      price: Number(form.get('price') ?? 0),
      duration_minutes: Number(form.get('duration_minutes') ?? 0),
    })
  }

  const openCreate = () => {
    setEditing(null)
    setCategoryId('')
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (s: Service) => {
    setEditing(s)
    setCategoryId(String(s.category_id))
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Servicios</h1>
        <div className="flex gap-2">
          {can('service_categories.view') && (
            <button onClick={() => navigate('/service-categories')} className={btnGhost}>
              Gestionar categorías
            </button>
          )}
          {can('services.create') && (
            <button onClick={openCreate} className={btnPrimary}>
              Nuevo servicio
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
          rowKey={(s) => s.id}
          onRowClick={(s) => openEdit(s)}
          pagination={{ page, totalPages, total, pageSize, onPageChange: setPage }}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar servicio ${editing.name}` : 'Nuevo servicio'}
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
            maxLength={150}
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
          <div className="col-span-2">
            <FormInput
              name="description"
              label="Descripción"
              required
              maxLength={500}
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
            required
            defaultValue={editing?.price ?? 1}
            error={fieldErrors.price}
          />
          <FormInput
            name="duration_minutes"
            label="Duración (min)"
            type="number"
            min={1}
            required
            defaultValue={editing?.duration_minutes ?? 1}
            error={fieldErrors.duration_minutes}
          />
          <div className="col-span-2 flex justify-between">
            {editing && can('services.delete') && (
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
        message={`¿Seguro que deseas eliminar el servicio "${editing?.name}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
        onConfirm={() => { if (editing) { deleteMutation.mutate(editing.id); setPendingDelete(false); setModalOpen(false); setEditing(null) } }}
        onCancel={() => setPendingDelete(false)}
      />

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
