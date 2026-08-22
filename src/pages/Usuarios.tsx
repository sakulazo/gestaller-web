// Usuarios y roles (CRUD + asignación de roles).

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { FormInput } from '../components/Form'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useFormMutation } from '../hooks/useFormMutation'
import { btnGhost, btnPrimary, btnSuccess, labelCls } from '../components/ui'
import { createUser, deleteUser, listRoles, listUsers, updateUser, restoreUser } from '../services'
import { userCreateSchema, userUpdateSchema } from '../lib/validation'
import type { User, UserInput } from '../types'

const columns: Column<User>[] = [
  { key: 'username', header: 'Usuario' },
  { key: 'name', header: 'Nombre' },
  { key: 'email', header: 'Email' },
  {
    key: 'roles',
    header: 'Roles',
    render: (u) => u.roles.join(', ') || '—',
  },
  { key: 'is_active', header: 'Activo', render: (u) => (u.is_active ? 'Sí' : 'No') },
]

export default function Usuarios() {
  const { can, getPermissionsForRoute } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)

  const query = useQuery({ queryKey: ['users'], queryFn: listUsers })
  const rolesQuery = useQuery({ queryKey: ['roles'], queryFn: listRoles })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<User, UserInput>({
    mutationFn: (payload) =>
      editing ? updateUser(editing.id, payload) : createUser(payload),
    schema: editing ? userUpdateSchema : userCreateSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente')
    },
    onConflict: (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreUser(id),
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
    const role_ids = form.getAll('role_ids').map((v) => Number(v))
    const password = String(form.get('password') ?? '')
    const payload: UserInput = {
      username: String(form.get('username') ?? ''),
      email: String(form.get('email') ?? ''),
      name: String(form.get('name') ?? ''),
      is_active: form.get('is_active') === 'on',
      role_ids,
      password: password || (editing ? 'sin-cambio' : ''),
    }
    const { password: _pw, ...rest } = payload
    if (password) {
      saveMutate(payload)
    } else {
      saveMutate(rest as UserInput)
    }
  }

  const openCreate = () => {
    setEditing(null)
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (u: User) => {
    setEditing(u)
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Usuarios</h1>
        <div className="flex gap-2">
          {getPermissionsForRoute('/roles').some(can) && (
            <button onClick={() => navigate('/roles')} className={btnGhost}>
              Gestionar roles
            </button>
          )}
          {can('users.create') && (
            <button onClick={openCreate} className={btnPrimary}>
              Nuevo usuario
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
          rowKey={(u) => u.id}
          onDelete={(u) => deleteMutation.mutate(u.id)}
          onEdit={openEdit}
          editPermission="users.edit"
          deletePermission="users.delete"
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar usuario ${editing.username}` : 'Nuevo usuario'}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          resetErrors()
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-4">
          <FormInput
            name="username"
            label="Usuario"
            required
            defaultValue={editing?.username ?? ''}
            error={fieldErrors.username}
          />
          <FormInput
            name="name"
            label="Nombre"
            required
            defaultValue={editing?.name ?? ''}
            error={fieldErrors.name}
          />
          <div className="col-span-2">
            <FormInput
              name="email"
              label="Email"
              type="email"
              required
              defaultValue={editing?.email ?? ''}
              error={fieldErrors.email}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>
              Contraseña {editing ? '(déjala vacía para no cambiarla)' : '*'}
            </label>
            <FormInput
              name="password"
              label=""
              type="password"
              required={!editing}
              minLength={8}
              error={fieldErrors.password}
            />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Roles</label>
            <div className="max-h-32 overflow-y-auto rounded border border-slate-200 p-2">
              {rolesQuery.data?.map((r) => (
                <label key={r.id} className="flex items-center gap-2 py-0.5 text-sm text-slate-600">
                  <input
                    name="role_ids"
                    type="checkbox"
                    value={r.id}
                    defaultChecked={editing?.roles.includes(r.name)}
                    className="h-4 w-4"
                  />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              name="is_active"
              type="checkbox"
              defaultChecked={editing ? editing.is_active : true}
              className="h-4 w-4"
            />
            <label className="text-sm text-slate-600">Activo</label>
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
