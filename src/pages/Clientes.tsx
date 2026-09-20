// Gestión de clientes (CRUD + búsqueda).

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { FormInput, FormTextarea } from '../components/Form'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useFormMutation } from '../hooks/useFormMutation'
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { inputCls } from '../components/ui'
import { createClient, deleteClient, listClients, restoreClient, updateClient } from '../services'
import { clientSchema } from '../lib/validation'
import type { Client, ClientInput } from '../types'

const columns: Column<Client>[] = [
  { key: 'name', header: 'Nombre/Razón social', align: 'left' },
  { key: 'phone', header: 'Teléfono' },
  { key: 'email', header: 'Email', align: 'left' },
  { key: 'city', header: 'Ciudad', align: 'left' },
  { key: 'state', header: 'Provincia', align: 'left' },
]

export default function Clientes() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)

  const { items, total, page, totalPages, pageSize, setPage, search, setSearch, isLoading } =
    usePaginatedQuery<Client>(['clients'], listClients)

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clients'] })

  const deleteMutation = useMutation({
    mutationFn: deleteClient,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Client, ClientInput>({
    mutationFn: (payload) =>
      editing ? updateClient(editing.id, payload) : createClient(payload),
    schema: clientSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Cliente actualizado correctamente' : 'Cliente creado correctamente')
    },
    onConflict: (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreClient(id),
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
    const required = (name: string) => String(form.get(name) ?? '').trim()
    saveMutate({
      name: required('name'),
      tax_id: required('tax_id'),
      phone: str('phone'),
      email: str('email'),
      address: required('address'),
      postal_code: required('postal_code'),
      state: required('state'),
      city: required('city'),
      country: String(form.get('country') ?? 'ES').trim() || 'ES',
      notes: str('notes'),
    })
  }

  const openCreate = () => {
    setEditing(null)
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (c: Client) => {
    setEditing(c)
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
        {can('clients.create') && (
          <button onClick={openCreate} className="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50">
            Nuevo cliente
          </button>
        )}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre, NIF o email…"
        className={`${inputCls} mb-4 w-full max-w-sm`}
      />

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(c) => c.id}
          onRowClick={(c) => openEdit(c)}
          pagination={{ page, totalPages, total, pageSize, onPageChange: setPage }}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar cliente ${editing.name}` : 'Nuevo cliente'}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          resetErrors()
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-4">
          <FormInput
            name="name"
            label="Nombre/Razón social"
            required
            defaultValue={editing?.name ?? ''}
            error={fieldErrors.name}
          />
          <FormInput
            name="tax_id"
            label="NIF"
            required
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
              required
              defaultValue={editing?.address ?? ''}
              error={fieldErrors.address}
            />
          </div>
          <FormInput
            name="postal_code"
            label="Código Postal"
            required
            defaultValue={editing?.postal_code ?? ''}
            error={fieldErrors.postal_code}
          />
          <FormInput
            name="city"
            label="Ciudad"
            required
            defaultValue={editing?.city ?? ''}
            error={fieldErrors.city}
          />
          <FormInput
            name="state"
            label="Provincia"
            required
            defaultValue={editing?.state ?? ''}
            error={fieldErrors.state}
          />
          <FormInput
            name="country"
            label="País"
            required
            maxLength={2}
            defaultValue={editing?.country ?? 'ES'}
            error={fieldErrors.country}
          />
          <div className="col-span-2">
            <FormTextarea
              name="notes"
              label="Observaciones"
              rows={3}
              defaultValue={editing?.notes ?? ''}
              error={fieldErrors.notes}
            />
          </div>
          <div className="col-span-2 flex justify-between">
            {editing && can('clients.delete') && (
              <button type="button" onClick={() => setPendingDelete(true)} className="rounded border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                Eliminar
              </button>
            )}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className="rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50">
                {isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar el cliente "${editing?.name}"? Esta acción no se puede deshacer.`}
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
