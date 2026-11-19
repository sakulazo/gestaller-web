// Gestión de plataforma: talleres y usuarios de cada taller (ADR-021).
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import { FormInput, FormPassword } from '../components/Form'
import Modal from '../components/Modal'
import PageHeader from '../components/PageHeader'
import { useToast } from '../components/Toast'
import { btnGhost, btnPrimary, btnSuccess, labelCls } from '../components/ui'
import { useFormMutation } from '../hooks/useFormMutation'
import {
  createTenant,
  createTenantUser,
  deleteTenantUser,
  listTenantRoles,
  listTenantUsers,
  listTenants,
  reactivateTenant,
  restoreTenantUser,
  suspendTenant,
  updateTenant,
  updateTenantUser,
} from '../services'
import { tenantSchema, tenantUpdateSchema, userCreateSchema, userUpdateSchema } from '../lib/validation'
import type { Tenant, TenantCreated, TenantInput, User, UserInput } from '../types'

const columns: Column<Tenant>[] = [
  { key: 'name', header: 'Taller', align: 'left' },
  { key: 'slug', header: 'Identificador', align: 'left' },
  {
    key: 'owner_email',
    header: 'Propietario',
    align: 'left',
    className: 'hidden md:table-cell',
    render: (t) => t.owner_email ?? '—',
  },
  { key: 'user_count', header: 'Usuarios', align: 'center', render: (t) => t.user_count ?? 0 },
  {
    key: 'status',
    header: 'Estado',
    align: 'center',
    render: (t) => (
      <span
        className={`rounded px-2 py-0.5 text-xs ${
          t.status === 'active'
            ? 'bg-emerald-100 text-emerald-800'
            : 'bg-slate-200 text-slate-700'
        }`}
      >
        {t.status === 'active' ? 'Activo' : 'Suspendido'}
      </span>
    ),
  },
]

export default function Tenants() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [tenantModal, setTenantModal] = useState(false)
  const [editing, setEditing] = useState<Tenant | null>(null)
  const [created, setCreated] = useState<TenantCreated | null>(null)
  const [usersTenant, setUsersTenant] = useState<Tenant | null>(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [userModal, setUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [pendingUserDelete, setPendingUserDelete] = useState<User | null>(null)
  const [pendingStatus, setPendingStatus] = useState<{
    tenant: Tenant
    action: 'suspend' | 'reactivate'
  } | null>(null)

  const tenantsQuery = useQuery({ queryKey: ['tenants'], queryFn: listTenants })
  const rolesQuery = useQuery({
    queryKey: ['tenant-roles', usersTenant?.id],
    queryFn: () => listTenantRoles(usersTenant!.id),
    enabled: usersTenant !== null,
  })
  const usersQuery = useQuery({
    queryKey: ['tenant-users', usersTenant?.id, showDeleted],
    queryFn: () => listTenantUsers(usersTenant!.id, showDeleted),
    enabled: usersTenant !== null,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['tenants'] })
    void queryClient.invalidateQueries({ queryKey: ['tenant-users'] })
  }

  const { mutate: saveTenant, isPending: savingTenant, fieldErrors, resetErrors } =
    useFormMutation<Tenant | TenantCreated, TenantInput>({
      mutationFn: (payload) =>
        editing ? updateTenant(editing.id, payload) : createTenant(payload),
      schema: editing ? tenantUpdateSchema : tenantSchema,
      onSuccess: (result) => {
        invalidate()
        setTenantModal(false)
        setEditing(null)
        if ('owner' in result) setCreated(result as TenantCreated)
        else toast.success('Taller actualizado correctamente')
      },
    })

  const statusMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'suspend' | 'reactivate' }) =>
      action === 'suspend' ? suspendTenant(id) : reactivateTenant(id),
    onSuccess: () => {
      invalidate()
      toast.success('Estado del taller actualizado')
    },
  })

  const userMutation = useMutation({
    mutationFn: (payload: { id?: number; values: UserInput }) =>
      payload.id
        ? updateTenantUser(usersTenant!.id, payload.id, payload.values)
        : createTenantUser(usersTenant!.id, payload.values),
    onSuccess: () => {
      invalidate()
      setUserModal(false)
      setEditingUser(null)
      toast.success('Usuario guardado correctamente')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (user: User) => deleteTenantUser(usersTenant!.id, user.id),
    onSuccess: () => {
      invalidate()
      setPendingUserDelete(null)
      toast.success('Usuario eliminado')
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (user: User) => restoreTenantUser(usersTenant!.id, user.id),
    onSuccess: () => {
      invalidate()
      toast.success('Usuario restaurado')
    },
  })

  const openCreate = () => {
    resetErrors()
    setEditing(null)
    setCreated(null)
    setTenantModal(true)
  }

  const openEdit = (tenant: Tenant) => {
    resetErrors()
    setEditing(tenant)
    setCreated(null)
    setTenantModal(true)
  }

  const openUsers = (tenant: Tenant) => {
    setShowDeleted(false)
    setUsersTenant(tenant)
  }

  const submitTenant = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: TenantInput = {
      name: String(form.get('name') ?? ''),
      slug: String(form.get('slug') ?? ''),
    }
    if (!payload.slug) delete payload.slug
    saveTenant(payload)
  }

  const openUserModal = (user: User | null) => {
    setEditingUser(user)
    setUserModal(true)
  }

  const submitUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const schema = editingUser ? userUpdateSchema : userCreateSchema
    const password = String(form.get('password') ?? '')
    const values: Record<string, unknown> = {
      // El campo está deshabilitado en edición: FormData no lo incluye.
      username: editingUser?.username ?? String(form.get('username') ?? ''),
      email: String(form.get('email') ?? ''),
      name: String(form.get('name') ?? ''),
      is_active: form.get('is_active') === 'on',
      role_ids: form.getAll('role_ids').map((v) => Number(v)),
    }
    // En edición, dejar la contraseña vacía significa «no cambiarla».
    if (!editingUser || password) values.password = password
    const parsed = schema.safeParse(values)
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Revisa el formulario')
      return
    }
    userMutation.mutate({ id: editingUser?.id, values: parsed.data as UserInput })
  }

  const userColumns: Column<User>[] = [
    { key: 'username', header: 'Usuario', align: 'left' },
    {
      key: 'name',
      header: 'Nombre',
      align: 'left',
      render: (u) => (
        <span>
          {u.name}
          {u.deleted_at && <span className="ml-2 text-xs text-slate-500">(borrado)</span>}
        </span>
      ),
    },
    { key: 'email', header: 'Email', align: 'left' },
    { key: 'roles', header: 'Roles', align: 'left', render: (u) => u.roles.join(', ') || '—' },
    { key: 'is_active', header: 'Activo', align: 'center', render: (u) => (u.is_active ? 'Sí' : 'No') },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      render: (u) => (
        <div className="flex justify-center gap-2">
          {u.deleted_at ? (
            <button
              type="button"
              className={btnGhost}
              onClick={() => restoreMutation.mutate(u)}
            >
              Restaurar
            </button>
          ) : (
            <>
              <button type="button" className={btnGhost} onClick={() => openUserModal(u)}>
                Editar
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => setPendingUserDelete(u)}
              >
                Borrar
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  const tenantColumns: Column<Tenant>[] = [
    ...columns,
    {
      key: 'actions',
      header: 'Acciones',
      align: 'center',
      render: (t) => (
        <div className="flex justify-center gap-2">
          <button type="button" className={btnGhost} onClick={() => openEdit(t)}>
            Editar
          </button>
          <button type="button" className={btnGhost} onClick={() => openUsers(t)}>
            Usuarios
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() =>
              setPendingStatus({
                tenant: t,
                action: t.status === 'active' ? 'suspend' : 'reactivate',
              })
            }
          >
            {t.status === 'active' ? 'Suspender' : 'Reactivar'}
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Talleres"
        subtitle="Alta y administración de instalaciones y de sus usuarios"
        actions={
          <button type="button" className={btnPrimary} onClick={openCreate}>
            <Plus size={16} className="mr-2 inline" /> Nuevo taller
          </button>
        }
      />
      <DataTable columns={tenantColumns} rows={tenantsQuery.data ?? []} rowKey={(t) => t.id} />

      <Modal
        open={tenantModal}
        title={editing ? 'Editar taller' : 'Nuevo taller'}
        onClose={() => setTenantModal(false)}
      >
        {created ? (
          <div className="space-y-3 text-sm">
            <p className="text-emerald-700">Taller creado. Entrega estas credenciales al propietario:</p>
            <pre className="overflow-x-auto rounded bg-slate-100 p-4 text-xs">
{`Taller:   ${created.tenant.name} (${created.tenant.slug})
Nombre:   ${created.owner.name}
Usuario:  ${created.owner.username}
Email:    ${created.owner.email}
Password: ${created.owner.password}
Rol:      ${created.owner.role}`}
            </pre>
            <button type="button" className={btnPrimary} onClick={() => setCreated(null)}>
              Entendido
            </button>
          </div>
        ) : (
          <form onSubmit={submitTenant} className="space-y-4">
            <div>
              <FormInput name="name" label="Nombre del taller" defaultValue={editing?.name ?? ''} />
              {fieldErrors.name && <p className="text-xs text-red-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <FormInput
                name="slug"
                label="Identificador (opcional)"
                defaultValue={editing?.slug ?? ''}
                placeholder="Se deriva del nombre"
              />
              {fieldErrors.slug && <p className="text-xs text-red-600">{fieldErrors.slug}</p>}
            </div>
            {!editing && (
              <p className="rounded bg-slate-50 p-3 text-xs text-slate-600">
                Se creará automáticamente un propietario con email{' '}
                <strong>&lt;identificador&gt;.owner@example.com</strong>, contraseña{' '}
                <strong>12345678</strong> y rol admin de ese taller.
              </p>
            )}
            <div className="flex gap-2">
              <button type="submit" className={btnSuccess} disabled={savingTenant}>Guardar</button>
              <button type="button" className={btnGhost} onClick={() => setTenantModal(false)}>Cancelar</button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={usersTenant !== null}
        title={`Usuarios de ${usersTenant?.name ?? ''}`}
        onClose={() => setUsersTenant(null)}
        wide
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={showDeleted}
              onChange={(e) => setShowDeleted(e.target.checked)}
            />
            Mostrar borrados
          </label>
          <button type="button" className={btnPrimary} onClick={() => openUserModal(null)}>
            <Plus size={16} className="mr-2 inline" /> Nuevo usuario
          </button>
        </div>
        <DataTable columns={userColumns} rows={usersQuery.data ?? []} rowKey={(u) => u.id} />

        <Modal open={userModal} title={editingUser ? 'Editar usuario' : 'Nuevo usuario'} onClose={() => setUserModal(false)} stacked>
          <form onSubmit={submitUser} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput name="username" label="Usuario" defaultValue={editingUser?.username ?? ''} disabled={!!editingUser} />
              <FormInput name="name" label="Nombre" defaultValue={editingUser?.name ?? ''} />
              <FormInput name="email" label="Email" type="email" defaultValue={editingUser?.email ?? ''} />
              <FormPassword name="password" label="Contraseña" autoComplete="new-password" />
            </div>
            <fieldset>
              <legend className={labelCls}>Roles</legend>
              <div className="flex flex-wrap gap-4">
                {(rolesQuery.data ?? []).map((role) => (
                  <label key={role.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="role_ids"
                      value={role.id}
                      defaultChecked={editingUser?.roles.includes(role.name) ?? role.name === 'admin'}
                    />
                    {role.name}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="is_active" defaultChecked={editingUser?.is_active ?? true} />
              Activo
            </label>
            <div className="flex gap-2">
              <button type="submit" className={btnSuccess} disabled={userMutation.isPending}>Guardar</button>
              <button type="button" className={btnGhost} onClick={() => setUserModal(false)}>Cancelar</button>
            </div>
          </form>
        </Modal>
      </Modal>

      <ConfirmDialog
        open={pendingUserDelete !== null}
        title="Borrar usuario"
        message={`¿Borrar a ${pendingUserDelete?.name ?? ''}? Podrá restaurarse después.`}
        onCancel={() => setPendingUserDelete(null)}
        onConfirm={() => pendingUserDelete && deleteMutation.mutate(pendingUserDelete)}
      />
      <ConfirmDialog
        open={pendingStatus !== null}
        title={pendingStatus?.action === 'suspend' ? 'Suspender taller' : 'Reactivar taller'}
        message={`¿${pendingStatus?.action === 'suspend' ? 'Suspender' : 'Reactivar'} ${pendingStatus?.tenant.name ?? ''}?`}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) statusMutation.mutate({ id: pendingStatus.tenant.id, action: pendingStatus.action })
          setPendingStatus(null)
        }}
      />
    </>
  )
}
