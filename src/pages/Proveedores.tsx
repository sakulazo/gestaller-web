// Proveedores (CRUD).

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { FormInput } from '../components/Form'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useFormMutation } from '../hooks/useFormMutation'
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { btnGhost, btnPrimary, btnSuccess } from '../components/ui'
import {
  createProvider,
  deleteProvider,
  listProviders,
  updateProvider,
  restoreProvider,
} from '../services'
import { providerSchema } from '../lib/validation'
import type { Provider } from '../types'

const columns: Column<Provider>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'tax_id', header: 'NIF' },
  { key: 'phone', header: 'Teléfono' },
  { key: 'email', header: 'Email' },
]

export default function Proveedores() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Provider | null>(null)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)

  const { items, total, page, totalPages, pageSize, setPage, isLoading } =
    usePaginatedQuery<Provider>(['providers'], listProviders)
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['providers'] })

  const deleteMutation = useMutation({
    mutationFn: deleteProvider,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Provider, Partial<Provider>>({
    mutationFn: (payload) =>
      editing ? updateProvider(editing.id, payload) : createProvider(payload as Provider),
    schema: providerSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente')
    },
    onConflict: (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreProvider(id),
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
      name: String(form.get('name') ?? ''),
      tax_id: str('tax_id'),
      phone: str('phone'),
      email: str('email'),
      address: str('address'),
    })
  }

  const openCreate = () => {
    setEditing(null)
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (p: Provider) => {
    setEditing(p)
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-page-title font-bold text-slate-800">Proveedores</h1>
        {can('providers.create') && (
          <button onClick={openCreate} className={btnPrimary}>
            Nuevo proveedor
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(p) => p.id}
          onRowClick={(p) => openEdit(p)}
          pagination={{ page, totalPages, total, pageSize, onPageChange: setPage }}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar proveedor ${editing.name}` : 'Nuevo proveedor'}
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
          <FormInput
            name="tax_id"
            label="NIF"
            defaultValue={editing?.tax_id ?? ''}
            error={fieldErrors.tax_id}
          />
          <FormInput
            name="phone"
            label="Teléfono"
            defaultValue={editing?.phone ?? ''}
            error={fieldErrors.phone}
          />
          <FormInput
            name="email"
            label="Email"
            type="email"
            defaultValue={editing?.email ?? ''}
            error={fieldErrors.email}
          />
          <div className="col-span-2">
            <FormInput
              name="address"
              label="Dirección"
              defaultValue={editing?.address ?? ''}
              error={fieldErrors.address}
            />
          </div>
          <div className="col-span-2 flex justify-between">
            {editing && can('providers.delete') && (
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
        message={`¿Seguro que deseas eliminar el proveedor "${editing?.name}"? Esta acción no se puede deshacer.`}
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
