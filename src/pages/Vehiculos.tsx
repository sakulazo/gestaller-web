// Gestión de vehículos (CRUD).

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
import SearchSelect from '../components/SearchSelect'
import { btnGhost, btnPrimary, btnSuccess, inputCls, labelCls } from '../components/ui'
import {
  createVehicle,
  deleteVehicle,
  listClients,
  listVehicleCategories,
  listVehicles,
  updateVehicle,
  restoreVehicle,
} from '../services'
import { vehicleSchema } from '../lib/validation'
import type { Vehicle, VehicleInput } from '../types'

const columns: Column<Vehicle>[] = [
  { key: 'plate', header: 'Matrícula' },
  { key: 'make', header: 'Marca' },
  { key: 'model', header: 'Modelo' },
  { key: 'year', header: 'Año' },
  { key: 'color', header: 'Color' },
]

export default function Vehiculos() {
  const navigate = useNavigate()
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [restoreInfo, setRestoreInfo] = useState<{ id: number; message: string } | null>(null)
  const [pendingDelete, setPendingDelete] = useState(false)
  const [clientId, setClientId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [search, setSearch] = useState('')

  const query = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles })
  const clientsQuery = useQuery({ queryKey: ['clients'], queryFn: listClients })
  const categoriesQuery = useQuery({ queryKey: ['vehicle-categories'], queryFn: listVehicleCategories })

  const clientName = (id: number) =>
    clientsQuery.data?.find((c) => c.id === id)?.name ?? '—'

  const categoryName = (id: number | null) =>
    categoriesQuery.data?.find((c) => c.id === id)?.name ?? '—'

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return query.data ?? []
    return (query.data ?? []).filter(
      (v) =>
        v.plate.toLowerCase().includes(term) ||
        v.make.toLowerCase().includes(term) ||
        (v.model ?? '').toLowerCase().includes(term) ||
        clientName(v.client_id).toLowerCase().includes(term),
    )
  }, [query.data, search, clientsQuery.data])

  const tableColumns: Column<Vehicle>[] = [
    ...columns,
    { key: 'client_id', header: 'Propietario', render: (v) => clientName(v.client_id) },
    { key: 'category_id', header: 'Categoría', render: (v) => categoryName(v.category_id) },
    {
      key: 'is_self_propelled',
      header: 'Autopropulsado',
      render: (v) => {
        const cat = categoriesQuery.data?.find((c) => c.id === v.category_id)
        return cat ? (cat.is_self_propelled ? 'Sí' : 'No') : '—'
      },
    },
  ]

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicles'] })

  const deleteMutation = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: invalidate,
  })

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Vehicle, VehicleInput>({
    mutationFn: (payload) =>
      editing ? updateVehicle(editing.id, payload) : createVehicle(payload),
    schema: vehicleSchema,
    onSuccess: () => {
      invalidate()
      setModalOpen(false)
      setEditing(null)
      toast.success(editing ? 'Vehículo actualizado correctamente' : 'Vehículo creado correctamente')
    },
    onConflict: (deletedId, message) => {
      setRestoreInfo({ id: deletedId, message })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (id: number) => restoreVehicle(id),
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
      client_id: Number(form.get('client_id')),
      category_id: form.get('category_id') ? Number(form.get('category_id')) : null,
      plate: String(form.get('plate') ?? ''),
      make: String(form.get('make') ?? ''),
      model: str('model'),
      year: form.get('year') ? Number(form.get('year')) : null,
      color: str('color'),
    })
  }

  const openCreate = () => {
    setEditing(null)
    setClientId('')
    setCategoryId('')
    resetErrors()
    setModalOpen(true)
  }
  const openEdit = (v: Vehicle) => {
    setEditing(v)
    setClientId(String(v.client_id))
    setCategoryId(v.category_id ? String(v.category_id) : '')
    resetErrors()
    setModalOpen(true)
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Vehículos</h1>
        <div className="flex gap-2">
          {can('vehicle_categories.view') && (
            <button onClick={() => navigate('/vehicle-categories')} className={btnGhost}>
              Gestionar categorías
            </button>
          )}
          {can('vehicles.create') && (
            <button onClick={openCreate} className={btnPrimary}>
              Nuevo vehículo
            </button>
          )}
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por matrícula, propietario, marca o modelo…"
        className={`${inputCls} mb-4 w-full max-w-sm`}
      />

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <DataTable
          columns={tableColumns}
          rows={rows}
          rowKey={(v) => v.id}
          onRowClick={(v) => openEdit(v)}
        />
      )}

      <Modal
        open={modalOpen}
        title={editing ? `Editar vehículo ${editing.plate}` : 'Nuevo vehículo'}
        onClose={() => {
          setModalOpen(false)
          setEditing(null)
          resetErrors()
        }}
      >
        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>Cliente *</label>
            <SearchSelect
              name="client_id"
              required
              placeholder="Selecciona un cliente…"
              options={(clientsQuery.data ?? []).map((c) => ({
                value: String(c.id),
                label: c.name,
              }))}
              value={clientId}
              onChange={setClientId}
            />
            <FieldError message={fieldErrors.client_id} />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>Categoría</label>
            <SearchSelect
              name="category_id"
              placeholder="Sin categoría"
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
            name="plate"
            label="Matrícula"
            required
            defaultValue={editing?.plate ?? ''}
            error={fieldErrors.plate}
          />
          <FormInput
            name="make"
            label="Marca"
            required
            defaultValue={editing?.make ?? ''}
            error={fieldErrors.make}
          />
          <FormInput
            name="model"
            label="Modelo"
            defaultValue={editing?.model ?? ''}
            error={fieldErrors.model}
          />
          <FormInput
            name="year"
            label="Año"
            type="number"
            defaultValue={editing?.year ?? ''}
            error={fieldErrors.year}
          />
          <div className="col-span-2">
            <FormInput
              name="color"
              label="Color"
              defaultValue={editing?.color ?? ''}
              error={fieldErrors.color}
            />
          </div>
          <div className="col-span-2 flex justify-between">
            {editing && can('vehicles.delete') && (
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
        message={`¿Seguro que deseas eliminar el vehículo "${editing?.plate}"? Esta acción no se puede deshacer.`}
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
