// Editor de líneas de detalle (items) para presupuestos y facturas.
// Cada línea es un servicio o un producto (item_type obligatorio),
// con precio, cantidad y descuento (%); el subtotal de línea se calcula.

import type { ReactNode } from 'react'
import type { ItemInput, ItemType, Product, Service, TaxRate } from '../types'
import SearchSelect from './SearchSelect'
import { btnGhost, inputCls } from './ui'

interface ItemsFormProps {
  items: ItemInput[]
  onChange: (items: ItemInput[]) => void
  services?: Service[]
  products?: Product[]
  taxRates?: TaxRate[]
  showTaxRate?: boolean
  disabled?: boolean
}

function toNumber(value: FormDataEntryValue | null): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function lineTotal(item: ItemInput): number {
  return item.quantity * item.unit_price * (1 - item.discount / 100)
}

export function itemTotal(items: ItemInput[]): number {
  return items.reduce((acc, it) => acc + lineTotal(it), 0)
}

export function lineTax(item: ItemInput, taxRates?: TaxRate[]): number {
  const rate = (taxRates ?? []).find((r) => r.id === item.tax_rate_id)
  if (!rate) return 0
  return lineTotal(item) * (Number(rate.rate) / 100)
}

export function itemTax(items: ItemInput[], taxRates?: TaxRate[]): number {
  return items.reduce((acc, it) => acc + lineTax(it, taxRates), 0)
}

export function itemGrandTotal(items: ItemInput[], taxRates?: TaxRate[]): number {
  return itemTotal(items) + itemTax(items, taxRates)
}

export function getDefaultTaxRateId(taxRates?: TaxRate[]): number | null {
  const active = (taxRates ?? []).filter((r) => r.is_active)
  const general = active.find((r) => /general/i.test(r.name))
  return general?.id ?? active[0]?.id ?? null
}

const clampDiscount = (n: number) => Math.min(100, Math.max(0, n))

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-slate-500">{label}</span>
      {children}
    </div>
  )
}

const newItem = (item_type: ItemType): ItemInput => ({
  item_type,
  service_id: null,
  product_id: null,
  assigned_to: null,
  description: '',
  quantity: 1,
  unit_price: 0,
  discount: 0,
  duration_minutes: null,
  tax_rate_id: null,
})

export default function ItemsForm({
  items,
  onChange,
  services,
  products,
  taxRates,
  showTaxRate,
  disabled,
}: ItemsFormProps) {
  const defaultTaxRateId = getDefaultTaxRateId(taxRates)

  const update = (index: number, patch: Partial<ItemInput>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  const addService = () =>
    onChange([...items, { ...newItem('service'), tax_rate_id: defaultTaxRateId }])
  const addProduct = () =>
    onChange([...items, { ...newItem('product'), tax_rate_id: defaultTaxRateId }])

  const selectService = (index: number, id: number) => {
    const service = services?.find((s) => s.id === id)
    update(index, {
      service_id: id,
      description: service ? service.name : '',
      unit_price: service ? Number(service.price) : 0,
      tax_rate_id: items[index].tax_rate_id ?? defaultTaxRateId,
    })
  }

  const selectProduct = (index: number, id: number) => {
    const product = products?.find((p) => p.id === id)
    update(index, {
      product_id: id,
      description: product ? product.name : '',
      unit_price: product ? Number(product.price) : 0,
      tax_rate_id: items[index].tax_rate_id ?? defaultTaxRateId,
    })
  }

  const conceptField = (item: ItemInput, index: number): ReactNode =>
    item.item_type === 'service' ? (
      <SearchSelect
        required
        placeholder="Selecciona servicio…"
        disabled={disabled}
        options={(services ?? []).map((s) => ({
          value: String(s.id),
          label: s.name,
        }))}
        value={item.service_id?.toString() ?? ''}
        onChange={(v) =>
          v ? selectService(index, Number(v)) : update(index, { service_id: null })
        }
      />
    ) : (
      <SearchSelect
        required
        placeholder="Selecciona producto…"
        disabled={disabled}
        options={(products ?? []).map((p) => ({
          value: String(p.id),
          label: p.name,
        }))}
        value={item.product_id?.toString() ?? ''}
        onChange={(v) =>
          v ? selectProduct(index, Number(v)) : update(index, { product_id: null })
        }
      />
    )

  const priceField = (item: ItemInput, index: number): ReactNode => (
    <div className="relative w-full">
      <input
        type="number"
        min={0}
        step="0.01"
        disabled={disabled}
        className={`${inputCls} w-full pr-5`}
        value={item.unit_price}
        onChange={(e) => update(index, { unit_price: toNumber(e.target.value) })}
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
    </div>
  )

  const quantityField = (item: ItemInput, index: number): ReactNode => (
    <input
      type="number"
      min={1}
      disabled={disabled}
      className={`${inputCls} w-full`}
      value={item.quantity}
      onChange={(e) => update(index, { quantity: Math.max(1, toNumber(e.target.value)) })}
    />
  )

  const discountField = (item: ItemInput, index: number): ReactNode => (
    <div className="relative w-full">
      <input
        type="number"
        min={0}
        max={100}
        step="0.01"
        disabled={disabled}
        className={`${inputCls} w-full pr-5`}
        value={item.discount}
        onChange={(e) =>
          update(index, { discount: clampDiscount(toNumber(e.target.value)) })
        }
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
    </div>
  )

  const taxField = (item: ItemInput, index: number): ReactNode =>
    !disabled && !taxRates?.length ? (
      <span className="text-xs text-slate-400">Sin tasas</span>
    ) : (
      <SearchSelect
        disabled={disabled}
        options={[
          { value: '', label: 'No aplica' },
          ...(taxRates ?? []).map((r) => ({
            value: String(r.id),
            label: `${Number(r.rate)} %`,
          })),
        ]}
        value={item.tax_rate_id?.toString() ?? ''}
        onChange={(v) =>
          v ? update(index, { tax_rate_id: Number(v) }) : update(index, { tax_rate_id: null })
        }
      />
    )

  return (
    <div>
      {items.length > 0 && (
        <>
          <div className="animate-fade-in space-y-3 sm:hidden">
            {items.map((item, idx) => (
              <div key={idx} className="rounded border border-slate-200 bg-white p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {item.item_type === 'service' ? 'Servicio' : 'Producto'}
                  </span>
                  {!disabled && (
                    <button type="button" onClick={() => remove(idx)} className="text-xs font-medium text-red-600 hover:text-red-800">
                      Quitar
                    </button>
                  )}
                </div>
                {conceptField(item, idx)}
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Field label="Precio">{priceField(item, idx)}</Field>
                  <Field label="Cantidad">{quantityField(item, idx)}</Field>
                  <Field label="Descuento">{discountField(item, idx)}</Field>
                </div>
                {showTaxRate && (
                  <div className="mt-2">
                    <Field label="IVA">{taxField(item, idx)}</Field>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-xs text-slate-500">Subtotal</span>
                  <span className="font-medium text-slate-700">{lineTotal(item).toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>

          <div className="animate-fade-in overflow-visible rounded border border-slate-200 hidden sm:block">
          <table className="min-w-full table-fixed text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-center font-medium">Tipo</th>
                <th className="w-[22.5rem] px-3 py-2 text-center font-medium">Concepto</th>
                <th className="w-[120px] px-3 py-2 text-center font-medium">Precio</th>
                <th className="w-[120px] px-3 py-2 text-center font-medium">Cantidad</th>
                <th className="w-[120px] px-3 py-2 text-center font-medium">Descuento</th>
                {showTaxRate && (
                  <th className="w-[120px] px-3 py-2 text-center font-medium">IVA</th>
                )}
                <th className="w-[130px] px-3 py-2 text-center font-medium">Subtotal</th>
                <th className="w-16 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-3 text-xs font-medium text-slate-500">
                    {item.item_type === 'service' ? 'Servicio' : 'Producto'}
                  </td>
                  <td className="w-[22.5rem] overflow-visible px-3 py-3">{conceptField(item, idx)}</td>
                  <td className="min-w-[120px] px-3 py-3">{priceField(item, idx)}</td>
                  <td className="min-w-[120px] px-3 py-3">{quantityField(item, idx)}</td>
                  <td className="min-w-[120px] px-3 py-3">{discountField(item, idx)}</td>
                  {showTaxRate && <td className="min-w-[120px] px-3 py-3">{taxField(item, idx)}</td>}
                  <td className="min-w-[120px] px-3 py-3 text-right font-medium text-slate-700">
                    {lineTotal(item).toFixed(2)} €
                  </td>
                  <td className="w-16 px-3 py-3 text-right">
                    {!disabled && (
                      <button type="button" onClick={() => remove(idx)} className="text-red-600 hover:text-red-800">
                        Quitar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
      <div className="mt-2 flex gap-2">
        {!disabled && (
          <>
            <button type="button" onClick={addService} className={btnGhost}>
              + Añadir servicio
            </button>
            <button type="button" onClick={addProduct} className={btnGhost}>
              + Añadir producto
            </button>
          </>
        )}
      </div>
    </div>
  )
}