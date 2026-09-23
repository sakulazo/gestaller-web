// Parámetros de configuración del sistema (Ajustes).

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { FieldError, FormInput } from '../components/Form'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useFormMutation } from '../hooks/useFormMutation'
import { btnPrimary } from '../components/ui'
import { getSettings, updateSetting } from '../services'
import { systemParameterSchema } from '../lib/validation'
import type { SystemParameter, SystemParameterInput } from '../types'

export default function Settings() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<SystemParameter | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data: parameters = [], isFetching } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['settings'] })

  const { mutate: saveSetting, isPending, fieldErrors, resetErrors } = useFormMutation<
    SystemParameter,
    SystemParameterInput
  >({
    mutationFn: (payload) => {
      if (!editing) return Promise.reject(new Error('Sin parámetro'))
      return updateSetting(editing.key, payload)
    },
    schema: systemParameterSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success('Parámetro actualizado correctamente')
    },
  })

  const columns: Column<SystemParameter>[] = [
    { key: 'key', header: 'Clave' },
    { key: 'value', header: 'Valor' },
    { key: 'description', header: 'Descripción' },
  ]

  const openEdit = (p: SystemParameter) => {
    setEditing(p)
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-page-title font-bold text-slate-800">Ajustes</h1>
      </div>

      {isFetching ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={parameters}
          rowKey={(p) => p.key}
          onRowClick={(p) => can('settings.edit') && openEdit(p)}
        />
      )}

      <Modal
        open={modalOpen}
        title={`Editar ${editing?.key ?? ''}`}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          resetErrors()
        }}
      >
        {editing && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              const value = String(new FormData(e.currentTarget).get('value') ?? '')
              saveSetting({ value, description: editing.description })
            }}
          >
            <div className="mb-4 text-sm text-slate-600">{editing.description}</div>
            <FormInput
              name="value"
              label="Valor"
              required
              defaultValue={editing.value}
              error={fieldErrors.value}
            />
            {editing.key === 'pagination.page_size' && (
              <p className="mt-2 text-xs text-slate-500">Entre 1 y 100.</p>
            )}
            <FieldError message={fieldErrors.form} />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600"
                onClick={() => {
                  setModalOpen(false)
                  setEditing(null)
                  resetErrors()
                }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className={btnPrimary}>
                {isPending ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}