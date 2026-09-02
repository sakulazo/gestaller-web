// Roles (RBAC): CRUD + asignación de permisos agrupada por módulo.

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { FormInput } from '../components/Form'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../components/Toast'
import { useFormMutation } from '../hooks/useFormMutation'
import { btnGhost, btnPrimary, btnSuccess, labelCls } from '../components/ui'
import {
  ROLE_TEMPLATE_DEFS,
  resolveTemplateCodes,
} from '../permissions'
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  updateRole,
  restoreRole,
} from '../services'
import { roleSchema } from '../lib/validation'
import type { Role, RoleInput } from '../types'

const columns: Column<Role>[] = [
  { key: 'name', header: 'Nombre' },
  { key: 'description', header: 'Descripción' },
  {
    key: 'permission_codes',
    header: 'Permisos',
    render: (r) => r.permission_codes.length,
  },
]

export default function Roles() {
  const { can, getModules } = useAuth()
  const { success, info } = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Role | null>(null)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const query = useQuery({ queryKey: ['roles'], queryFn: listRoles })
  const permissionsQuery = useQuery({
    queryKey: ['permissions'],
    queryFn: listPermissions,
  })

  useEffect(() => {
    setSelected(new Set(editing?.permission_codes ?? []))
  }, [modalOpen, editing])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roles'] })

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      invalidate()
      success('Rol eliminado correctamente')
    },
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Role, RoleInput>({
    mutationFn: (payload) =>
      editing ? updateRole(editing.id, payload) : createRole(payload),
    schema: roleSchema,
    onSuccess: () => {
      invalidate()
      success(editing ? 'Rol actualizado correctamente' : 'Rol creado correctamente')
      setModalOpen(false)
      setEditing(null)
    },
    onConflict: (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreRole(id),
    onSuccess: () => {
      invalidate()
      success('Rol restaurado correctamente')
      setRestoreInfo(null)
      setModalOpen(false)
      setEditing(null)
    },
  })

  const codes = permissionsQuery.data ?? []
  const allCodes = codes.map((p) => p.code)
  const labelOf = (code: string) =>
    codes.find((p) => p.code === code)?.name ?? code

  const modules = getModules()

  const depsOf = (code: string): string[] => {
    const [moduleKey, action] = code.split('.')
    const mod = modules.find((m) => m.key === moduleKey)
    const view = `${moduleKey}.view`
    const explicit = mod?.dependencies?.[action] ?? []
    return [...new Set([view, ...explicit])].filter(
      (d) => d !== code && allCodes.includes(d),
    )
  }

  const toggle = (code: string, checked: boolean) => {
    if (!checked) {
      const required = [...selected].some(
        (c) => c !== code && depsOf(c).includes(code),
      )
      if (required) {
        info(`No puedes quitar "${labelOf(code)}": es requerido por otro permiso seleccionado`)
        return
      }
      setSelected((prev) => {
        const next = new Set(prev)
        next.delete(code)
        return next
      })
      return
    }
    setSelected((prev) => {
      const next = new Set(prev)
      next.add(code)
      depsOf(code).forEach((d) => next.add(d))
      return next
    })
  }

  const toggleModule = (module: string) => {
    const modCodes = allCodes.filter((c) => c.startsWith(`${module}.`))
    const allChecked = modCodes.every((c) => selected.has(c))
    if (allChecked) {
      const next = new Set(selected)
      const outside = [...selected].filter((x) => !modCodes.includes(x))
      let blocked = 0
      for (const c of modCodes) {
        const required = outside.some((x) => depsOf(x).includes(c))
        if (required) {
          blocked++
        } else {
          next.delete(c)
        }
      }
      setSelected(next)
      if (blocked > 0) {
        info(
          `No se pudieron quitar ${blocked} permiso(s) del módulo: son requeridos por otros módulos`,
        )
      }
      return
    }
    setSelected((prev) => {
      const next = new Set(prev)
      for (const c of modCodes) {
        next.add(c)
        depsOf(c).forEach((d) => next.add(d))
      }
      return next
    })
  }

  const applyTemplate = (key: string) => {
    const next = new Set<string>()
    for (const c of resolveTemplateCodes(key, allCodes)) {
      if (!allCodes.includes(c)) continue
      next.add(c)
      depsOf(c).forEach((d) => next.add(d))
    }
    setSelected(next)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const description = String(form.get('description') ?? '').trim()
    saveMutate({
      name: String(form.get('name') ?? ''),
      description: description || null,
      permission_codes: [...selected],
    })
  }

  const openCreate = () => {
    setEditing(null)
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (r: Role) => {
    setEditing(r)
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Roles</h1>
        {can('roles.create') && (
          <button onClick={openCreate} className={btnPrimary}>
            Nuevo rol
          </button>
        )}
      </div>

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={query.data ?? []}
          rowKey={(r) => r.id}
          onRowClick={(r) => openEdit(r)}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar rol ${editing.name}` : 'Nuevo rol'}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          resetErrors()
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              name="name"
              label="Nombre"
              required
              defaultValue={editing?.name ?? ''}
              error={fieldErrors.name}
            />
            <div className="col-span-2">
              <FormInput
                name="description"
                label="Descripción"
                defaultValue={editing?.description ?? ''}
                error={fieldErrors.description}
              />
            </div>
          </div>

          {!editing && (
            <div>
              <label className={labelCls}>Plantilla base</label>
              <div className="flex flex-wrap gap-2">
                {ROLE_TEMPLATE_DEFS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => applyTemplate(t.key)}
                    className={`${btnGhost} text-xs`}
                    title={t.description}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Rellena los permisos; luego puedes ajustarlos a mano.
              </p>
            </div>
          )}

          <div>
            <label className={labelCls}>
              Permisos ({selected.size})
            </label>
            <div className="max-h-96 space-y-3 overflow-y-auto rounded border border-slate-200 p-2">
              {getModules().map((mod) => {
                const modCodes = codes.filter((p) => p.code.startsWith(`${mod.key}.`))
                if (modCodes.length === 0) return null
                const allChecked = modCodes.every((p) => selected.has(p.code))
                return (
                  <div key={mod.key}>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <span className="text-sm font-semibold text-slate-700">{mod.label}</span>
                      <button
                        type="button"
                        onClick={() => toggleModule(mod.key)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {allChecked ? 'Quitar todos' : 'Marcar todos'}
                      </button>
                    </div>
                    <div className="mt-1 grid grid-cols-2 gap-x-4">
                      {modCodes.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 py-0.5 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            checked={selected.has(p.code)}
                            onChange={(e) => toggle(p.code, e.target.checked)}
                            className="h-4 w-4"
                          />
                          <span title={p.description ?? ''}>{p.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-between">
            {editing && can('roles.delete') && (
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
        message={`¿Seguro que deseas eliminar el rol "${editing?.name}"? Esta acción no se puede deshacer.`}
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
