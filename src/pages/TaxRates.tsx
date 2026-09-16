// Tasas de impuesto (IVA).

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Checkbox from '../components/Checkbox'
import ConfirmDialog from '../components/ConfirmDialog'
import DataTable, { type Column } from '../components/DataTable'
import Modal from '../components/Modal'
import { FieldError, FormInput } from '../components/Form'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useFormMutation } from '../hooks/useFormMutation'
import { usePaginatedQuery } from '../hooks/usePaginatedQuery'
import { btnGhost, btnPrimary, btnSuccess } from '../components/ui'
import {
  createTaxRate,
  deleteTaxRate,
  listTaxRates,
  restoreTaxRate,
  updateTaxRate,
} from '../services'
import { taxRateSchema } from '../lib/validation'
import type { TaxRate, TaxRateInput } from '../types'

export default function TaxRates() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TaxRate | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)

  const { items, total, page, totalPages, pageSize, setPage, isLoading } =
    usePaginatedQuery<TaxRate>(['tax-rates'], listTaxRates)

  const columns: Column<TaxRate>[] = useMemo(() => [
    { key: 'name', header: 'Nombre' },
    {
      key: 'rate',
      header: 'Tasa',
      align: 'center',
      render: (t) => `${Number(t.rate)} %`,
    },
    {
      key: 'is_active',
      header: 'Estado',
      align: 'center',
      render: (t) => (t.is_active ? 'Activa' : 'Inactiva'),
    },
  ], [])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['tax-rates'] })

  const deleteMutation = useMutation({
    mutationFn: deleteTaxRate,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<TaxRate, TaxRateInput>({
    mutationFn: (payload) =>
      editing ? updateTaxRate(editing.id, payload) : createTaxRate(payload),
    schema: taxRateSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Tasa de IVA actualizada correctamente' : 'Tasa de IVA creada correctamente')
    },
    onConflict: (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreTaxRate(id),
    onSuccess: () => {
      invalidate()
      setRestoreInfo(null)
      setModalOpen(false)
      setEditing(null)
      toast.success('Tasa de IVA restaurada correctamente')
    },
  })

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    saveMutate({
      name: String(form.get('name') ?? ''),
      rate: Number(form.get('rate') ?? 0),
      is_active: isActive,
    })
  }

  const openCreate = () => {
    setEditing(null)
    setIsActive(true)
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (t: TaxRate) => {
    setEditing(t)
    setIsActive(t.is_active)
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Tasas de IVA</h1>
        {can('tax_rates.create') && (
          <button onClick={openCreate} className={btnPrimary}>
            Nueva tasa
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={columns}
          rows={items}
          rowKey={(t) => t.id}
          onRowClick={(t) => openEdit(t)}
          pagination={{ page, totalPages, total, pageSize, onPageChange: setPage }}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar tasa ${editing.name}` : 'Nueva tasa de IVA'}
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
            maxLength={100}
            defaultValue={editing?.name ?? ''}
            error={fieldErrors.name}
          />
          <FormInput
            name="rate"
            label="Tasa (%)"
            type="number"
            step="0.01"
            min={0}
            max={100}
            required
            defaultValue={editing?.rate ?? 21}
            error={fieldErrors.rate}
          />
          <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600">
            <Checkbox
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Tasa activa
          </div>
          <div className="col-span-2 flex justify-between">
            {editing && can('tax_rates.delete') && (
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
          <FieldError message={fieldErrors.is_active} />
        </form>
      </Modal>
      <ConfirmDialog
        open={pendingDelete}
        title="Confirmar eliminación"
        message={`¿Seguro que deseas eliminar la tasa "${editing?.name}"? Esta acción no se puede deshacer.`}
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