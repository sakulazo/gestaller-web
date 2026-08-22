// Gestor genérico de categorías (servicio/producto) con CRUD.

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from './ConfirmDialog'
import DataTable, { type Column } from './DataTable'
import Modal from './Modal'
import { FormInput } from './Form'
import { useToast } from './Toast'
import { useFormMutation } from '../hooks/useFormMutation'
import { useAuth } from '../hooks/useAuth'
import { categorySchema } from '../lib/validation'
import { btnGhost, btnPrimary, btnSuccess } from './ui'

interface CategoryRow {
  id: number
  name: string
  description: string | null
  is_active: boolean
  is_self_propelled?: boolean
}

interface CategoryManagerProps {
  title: string
  queryKey: string
  list: () => Promise<CategoryRow[]>
  create: (payload: { name: string; description?: string | null; is_active?: boolean; is_self_propelled?: boolean }) => Promise<CategoryRow>
  update: (id: number, payload: Partial<CategoryRow>) => Promise<CategoryRow>
  remove: (id: number) => Promise<void>
  createPermission: string
  editPermission: string
  deletePermission: string
  showSelfPropelled?: boolean
  restore?: (id: number) => Promise<unknown>
  restoreQueryKey?: string
}

const columns: Column<CategoryRow>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'description', header: 'Descripción' },
  { key: 'is_active', header: 'Activo', render: (c) => (c.is_active ? 'Sí' : 'No') },
]

const selfPropelledColumn: Column<CategoryRow> = {
  key: 'is_self_propelled',
  header: 'Autopropulsado',
  render: (c) => (c.is_self_propelled ? 'Sí' : 'No'),
}

export default function CategoryManager({
  title,
  queryKey,
  list,
  create,
  update,
  remove,
  createPermission,
  editPermission,
  deletePermission,
  showSelfPropelled,
  restore,
  restoreQueryKey,
}: CategoryManagerProps) {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)

  const query = useQuery({ queryKey: [queryKey], queryFn: list })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] })
    if (restoreQueryKey) {
      queryClient.invalidateQueries({ queryKey: [restoreQueryKey] })
    }
  }

  const deleteMutation = useMutation({
    mutationFn: remove,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<CategoryRow, { name: string; description?: string | null; is_active?: boolean; is_self_propelled?: boolean }>({
    mutationFn: (payload) =>
      editing ? update(editing.id, payload) : create(payload),
    schema: categorySchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente')
    },
    onConflict: restore ? (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    } : undefined,
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restore!(id),
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
    const description = String(form.get('description') ?? '').trim()
    saveMutate({
      name: String(form.get('name') ?? ''),
      description: description || null,
      is_active: form.get('is_active') === 'on',
      ...(showSelfPropelled ? { is_self_propelled: form.get('is_self_propelled') === 'on' } : {}),
    })
  }

  const openCreate = () => {
    setEditing(null)
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (c: CategoryRow) => {
    setEditing(c)
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        {can(createPermission) && (
          <button onClick={openCreate} className={btnPrimary}>
            Nueva categoría
          </button>
        )}
      </div>

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={showSelfPropelled ? [...columns, selfPropelledColumn] : columns}
          rows={query.data ?? []}
          rowKey={(c) => c.id}
          onDelete={(c) => deleteMutation.mutate(c.id)}
          onEdit={openEdit}
          editPermission={editPermission}
          deletePermission={deletePermission}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar categoría ${editing.name}` : `Nueva categoría de ${title.toLowerCase()}`}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          resetErrors()
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <FormInput
              name="name"
              label="Nombre"
              required
              defaultValue={editing?.name ?? ''}
              error={fieldErrors.name}
            />
          </div>
          <div className="col-span-2">
            <FormInput
              name="description"
              label="Descripción"
              defaultValue={editing?.description ?? ''}
              error={fieldErrors.description}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={editing ? editing.is_active : true}
              className="h-4 w-4"
            />
            <label className="text-sm text-slate-600">Activa</label>
          </div>
          {showSelfPropelled && (
            <div className="col-span-2 flex items-center gap-2">
              <input
                name="is_self_propelled"
                type="checkbox"
                defaultChecked={editing ? editing.is_self_propelled : true}
                className="h-4 w-4"
              />
              <label className="text-sm text-slate-600">Autopropulsado</label>
            </div>
          )}
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
