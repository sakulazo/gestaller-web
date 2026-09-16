// Modal de creación de factura (reutilizado desde /facturas y desde el
// seguimiento de una orden entregada). La emisión es irrevocable.

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'
import { useAuth } from '../hooks/useAuth'
import ItemsForm, {
  getDefaultTaxRateId,
  itemGrandTotal,
  itemTax,
  itemTotal,
} from '../components/ItemsForm'
import SearchSelect from '../components/SearchSelect'
import { btnGhost, btnSuccess, inputCls, labelCls } from '../components/ui'
import { FieldError, FormTextarea } from '../components/Form'
import { useToast } from '../components/Toast'
import { useFormMutation } from '../hooks/useFormMutation'
import {
  createInvoice,
  listClients,
  listProducts,
  listServices,
  listTaxRates,
  listVehicleCategories,
  listVehicles,
  listWorkOrders,
} from '../services'
import { invoiceSchema } from '../lib/validation'
import type { Invoice, InvoiceInput, ItemInput, WorkOrder, WorkOrderItem } from '../types'

interface InvoiceFormModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  prefillWorkOrder?: WorkOrder | null
}

function vehicleLabel(v: { plate: string; make: string; model: string | null }) {
  return `${v.plate} — ${v.make} ${v.model ?? ''}`.trim()
}

function workOrderItemToInput(it: WorkOrderItem, defaultTaxRateId: number | null): ItemInput {
  return {
    item_type: it.item_type,
    service_id: it.service_id,
    product_id: it.product_id,
    assigned_to: null,
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unit_price,
    discount: it.discount,
    duration_minutes: null,
    tax_rate_id: defaultTaxRateId,
  }
}

export default function InvoiceFormModal({
  open,
  onClose,
  onCreated,
  prefillWorkOrder,
}: InvoiceFormModalProps) {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const locked = Boolean(prefillWorkOrder)

  const [items, setItems] = useState<ItemInput[]>([])
  const [clientId, setClientId] = useState('')
  const [motorVehicleId, setMotorVehicleId] = useState('')
  const [trailerVehicleId, setTrailerVehicleId] = useState('')
  const [workOrderId, setWorkOrderId] = useState('')
  const [mileage, setMileage] = useState('')
  const [pendingPayload, setPendingPayload] = useState<InvoiceInput | null>(null)

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => listClients({ all: true }).then((r) => r.items),
  })
  const vehiclesQuery = useQuery({
    queryKey: ['vehicles'],
    queryFn: () => listVehicles({ all: true }).then((r) => r.items),
  })
  const taxRatesQuery = useQuery({
    queryKey: ['tax-rates'],
    queryFn: () => listTaxRates({ all: true }).then((r) => r.items),
  })
  const workOrdersQuery = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => listWorkOrders({ all: true }).then((r) => r.items),
  })
  const servicesQuery = useQuery({
    queryKey: ['services'],
    queryFn: () => listServices({ all: true }).then((r) => r.items),
    enabled: can('services.view'),
  })
  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => listProducts({ all: true }).then((r) => r.items),
    enabled: can('products.view'),
  })
  const categoriesQuery = useQuery({
    queryKey: ['vehicle-categories'],
    queryFn: () => listVehicleCategories({ all: true }).then((r) => r.items),
  })

  const defaultTaxRateId = getDefaultTaxRateId(taxRatesQuery.data)

  // Resetea el formulario (o lo rellena desde la orden) en cada apertura.
  useEffect(() => {
    if (!open) return
    if (prefillWorkOrder) {
      setItems(prefillWorkOrder.items.map((it) => workOrderItemToInput(it, defaultTaxRateId)))
      setClientId(String(prefillWorkOrder.client_id))
      setMotorVehicleId(prefillWorkOrder.motor_vehicle_id ? String(prefillWorkOrder.motor_vehicle_id) : '')
      setTrailerVehicleId(prefillWorkOrder.trailer_vehicle_id ? String(prefillWorkOrder.trailer_vehicle_id) : '')
      setWorkOrderId(String(prefillWorkOrder.id))
      setMileage(prefillWorkOrder.mileage != null ? String(prefillWorkOrder.mileage) : '')
    } else {
      setItems([])
      setClientId('')
      setMotorVehicleId('')
      setTrailerVehicleId('')
      setWorkOrderId('')
      setMileage('')
    }
    setPendingPayload(null)
    resetErrors()
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Asigna la tasa por defecto a las líneas sin IVA al abrir el modal.
  useEffect(() => {
    if (!open || defaultTaxRateId == null) return
    setItems((prev) =>
      prev.map((it) => (it.tax_rate_id == null ? { ...it, tax_rate_id: defaultTaxRateId } : it)),
    )
  }, [open, defaultTaxRateId])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['work-orders'] })
  }

  const { mutate: saveMutate, isPending, fieldErrors, resetErrors } = useFormMutation<Invoice, InvoiceInput>({
    mutationFn: createInvoice,
    schema: invoiceSchema,
    onSuccess: () => {
      invalidate()
      setPendingPayload(null)
      toast.success('Factura creada correctamente')
      onCreated()
    },
  })

  const vehicleLabelOf = (id: string) => {
    if (!id) return null
    const v = vehiclesQuery.data?.find((veh) => String(veh.id) === id)
    return v ? vehicleLabel(v) : null
  }

  const vehiclesOf = useMemo(
    () => (cid: string) =>
      !cid
        ? vehiclesQuery.data ?? []
        : (vehiclesQuery.data ?? []).filter((v) => String(v.client_id) === cid),
    [vehiclesQuery.data],
  )

  const categoryMap = useMemo(() => {
    const m = new Map<number, boolean>()
    for (const c of categoriesQuery.data ?? []) m.set(c.id, c.is_self_propelled)
    return m
  }, [categoriesQuery.data])

  const motorVehiclesOf = useMemo(
    () => (cid: string) =>
      vehiclesOf(cid).filter((v) => v.category_id != null && categoryMap.get(v.category_id) === true),
    [vehiclesOf, categoryMap],
  )

  const trailerVehiclesOf = useMemo(
    () => (cid: string) =>
      vehiclesOf(cid).filter((v) => v.category_id != null && categoryMap.get(v.category_id) === false),
    [vehiclesOf, categoryMap],
  )

  const invoiceableOrders = useMemo(() => {
    const rows = workOrdersQuery.data ?? []
    return rows.filter((o) => o.delivered_at != null && !o.cancelled_at)
  }, [workOrdersQuery.data])

  const selectWorkOrder = (v: string) => {
    setWorkOrderId(v)
    const o = (workOrdersQuery.data ?? []).find((wo) => String(wo.id) === v)
    if (!o) return
    setClientId(String(o.client_id))
    setMotorVehicleId(o.motor_vehicle_id ? String(o.motor_vehicle_id) : '')
    setTrailerVehicleId(o.trailer_vehicle_id ? String(o.trailer_vehicle_id) : '')
    setMileage(o.mileage != null ? String(o.mileage) : '')
    setItems(o.items.map((it) => workOrderItemToInput(it, defaultTaxRateId)))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const payload: InvoiceInput = {
      client_id: Number(form.get('client_id')),
      motor_vehicle_id: form.get('motor_vehicle_id') ? Number(form.get('motor_vehicle_id')) : null,
      trailer_vehicle_id: form.get('trailer_vehicle_id') ? Number(form.get('trailer_vehicle_id')) : null,
      mileage: form.get('mileage') ? Number(form.get('mileage')) : null,
      work_order_id: workOrderId ? Number(workOrderId) : null,
      notes: String(form.get('notes') ?? '').trim() || null,
      items,
    }
    const result = invoiceSchema.safeParse(payload)
    if (!result.success) {
      saveMutate(payload)
      return
    }
    setPendingPayload(payload)
  }

  const title = locked ? `Nueva factura · Orden ${prefillWorkOrder?.number}` : 'Nueva factura'

  return (
    <>
      <Modal open={open} title={title} onClose={onClose} stacked={locked} wide>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Cliente *</label>
              {locked ? (
                <>
                  <input type="hidden" name="client_id" value={clientId} />
                  <input
                    type="text"
                    value={clientsQuery.data?.find((c) => c.id === Number(clientId))?.name ?? ''}
                    readOnly
                    className={`${inputCls} w-full bg-slate-50`}
                  />
                </>
              ) : (
                <>
                  <SearchSelect
                    name="client_id"
                    required
                    placeholder="Selecciona cliente…"
                    options={(clientsQuery.data ?? []).map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                    value={clientId}
                    onChange={(v) => {
                      setClientId(v)
                      if (
                        motorVehicleId &&
                        !motorVehiclesOf(v).some((veh) => String(veh.id) === motorVehicleId)
                      ) {
                        setMotorVehicleId('')
                      }
                      if (
                        trailerVehicleId &&
                        !trailerVehiclesOf(v).some((veh) => String(veh.id) === trailerVehicleId)
                      ) {
                        setTrailerVehicleId('')
                      }
                    }}
                  />
                  <FieldError message={fieldErrors.client_id} />
                </>
              )}
            </div>
            <div>
              <label className={labelCls}>Orden de trabajo</label>
              {locked ? (
                <>
                  <input type="hidden" name="work_order_id" value={prefillWorkOrder?.id ?? ''} />
                  <input
                    type="text"
                    value={prefillWorkOrder?.number ?? ''}
                    readOnly
                    className={`${inputCls} w-full bg-slate-50`}
                  />
                </>
              ) : (
                <>
                  <SearchSelect
                    name="work_order_id"
                    placeholder="Sin orden asociada"
                    options={invoiceableOrders.map((o) => ({
                      value: String(o.id),
                      label: o.number,
                    }))}
                    value={workOrderId}
                    onChange={selectWorkOrder}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Al seleccionar una orden entregada, la factura se vincula a ella, se copian sus líneas y la orden pasa al histórico.
                  </p>
                </>
              )}
            </div>
          </div>
          <div className={motorVehicleId ? 'grid grid-cols-3 gap-4' : 'grid grid-cols-2 gap-4'}>
            <div>
              <label className={labelCls}>Vehículo a motor</label>
              {locked ? (
                <>
                  <input type="hidden" name="motor_vehicle_id" value={motorVehicleId} />
                  <input
                    type="text"
                    value={vehicleLabelOf(motorVehicleId) ?? ''}
                    readOnly
                    className={`${inputCls} w-full bg-slate-50`}
                  />
                </>
              ) : (
                <>
                  <SearchSelect
                    name="motor_vehicle_id"
                    placeholder="Sin vehículo a motor"
                    options={motorVehiclesOf(clientId).map((v) => ({
                      value: String(v.id),
                      label: vehicleLabel(v),
                    }))}
                    value={motorVehicleId}
                    onChange={setMotorVehicleId}
                  />
                  <FieldError message={fieldErrors.motor_vehicle_id} />
                </>
              )}
            </div>
            {motorVehicleId && (
              <div>
                <label className={labelCls}>Kilometraje</label>
                {locked ? (
                  <>
                    <input type="hidden" name="mileage" value={mileage} />
                    <input
                      type="text"
                      value={mileage ? `${Number(mileage).toLocaleString('es-ES')} km` : '—'}
                      readOnly
                      className={`${inputCls} w-full bg-slate-50`}
                    />
                  </>
                ) : (
                  <>
                    <input
                      name="mileage"
                      type="number"
                      min={0}
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder="km"
                      className={`${inputCls} w-full`}
                    />
                    <FieldError message={fieldErrors.mileage} />
                  </>
                )}
              </div>
            )}
            <div>
              <label className={labelCls}>Remolque</label>
              {locked ? (
                <>
                  <input type="hidden" name="trailer_vehicle_id" value={trailerVehicleId} />
                  <input
                    type="text"
                    value={vehicleLabelOf(trailerVehicleId) ?? ''}
                    readOnly
                    className={`${inputCls} w-full bg-slate-50`}
                  />
                </>
              ) : (
                <SearchSelect
                  name="trailer_vehicle_id"
                  placeholder="Sin remolque"
                  options={trailerVehiclesOf(clientId).map((v) => ({
                    value: String(v.id),
                    label: vehicleLabel(v),
                  }))}
                  value={trailerVehicleId}
                  onChange={setTrailerVehicleId}
                />
              )}
            </div>
          </div>
          <div>
            <FormTextarea
              name="notes"
              label="Observaciones"
              rows={3}
              defaultValue={''}
            />
          </div>

          <div>
            <label className={labelCls}>Líneas de detalle</label>
            <ItemsForm
              items={items}
              onChange={setItems}
              services={servicesQuery.data}
              products={productsQuery.data}
              taxRates={taxRatesQuery.data}
              showTaxRate
            />
            <p className="mt-2 space-x-4 text-sm text-slate-600">
              <span>
                Base imponible: <strong>{itemTotal(items).toFixed(2)} €</strong>
              </span>
              <span>
                IVA: <strong>{itemTax(items, taxRatesQuery.data).toFixed(2)} €</strong>
              </span>
              <span>
                Total de la factura: <strong>{itemGrandTotal(items, taxRatesQuery.data).toFixed(2)} €</strong>
              </span>
            </p>
          </div>

          <div className="flex justify-between">
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={onClose} className={btnGhost}>
                Cancelar
              </button>
              <button type="submit" disabled={isPending} className={btnSuccess}>
                {isPending ? 'Emitiendo…' : 'Emitir'}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={pendingPayload !== null}
        title="Emitir factura"
        message="La emisión de una factura es una acción irrevocable: quedará emitida y no podrá modificarse. ¿Deseas continuar?"
        confirmLabel="Emitir"
        danger
        stacked={locked}
        onConfirm={() => {
          if (pendingPayload) {
            saveMutate(pendingPayload)
            setPendingPayload(null)
          }
        }}
        onCancel={() => setPendingPayload(null)}
      />
    </>
  )
}