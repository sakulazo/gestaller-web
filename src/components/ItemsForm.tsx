// Editor de líneas de detalle (items) para órdenes, presupuestos y facturas.
// Cada línea es un servicio o un producto (item_type obligatorio).

import type { ItemInput, ItemType, Product, Service, User } from '../types'
import SearchSelect from './SearchSelect'
import { btnGhost, inputCls } from './ui'

interface ItemsFormProps {
  items: ItemInput[]
  onChange: (items: ItemInput[]) => void
  services?: Service[]
  products?: Product[]
  users?: User[]
}

function toNumber(value: FormDataEntryValue | null): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function itemTotal(items: ItemInput[]): number {
  return items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0)
}

const newItem = (item_type: ItemType): ItemInput => ({
  item_type,
  service_id: null,
  product_id: null,
  assigned_to: null,
  description: '',
  quantity: 1,
  unit_price: 0,
})

export default function ItemsForm({
  items,
  onChange,
  services,
  products,
  users,
}: ItemsFormProps) {
  const update = (index: number, patch: Partial<ItemInput>) => {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index))

  const addService = () => onChange([...items, newItem('service')])
  const addProduct = () => onChange([...items, newItem('product')])

  const selectService = (index: number, id: number) => {
    const service = services?.find((s) => s.id === id)
    update(index, {
      service_id: id,
      description: service ? service.name : '',
      unit_price: service ? Number(service.price) : 0,
    })
  }

  const selectProduct = (index: number, id: number) => {
    const product = products?.find((p) => p.id === id)
    update(index, {
      product_id: id,
      description: product ? product.name : '',
      unit_price: product ? Number(product.price) : 0,
    })
  }

  return (
    <div>
      {items.length > 0 && (
        <div className="animate-fade-in overflow-visible rounded border border-slate-200">
          <table className="min-w-full table-layout-fixed text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Tipo</th>
                <th className="w-[22.5rem] px-3 py-2 text-left font-medium">Concepto</th>
                <th className="w-64 px-3 py-2 text-left font-medium">Asignado a</th>
                <th className="w-[120px] px-3 py-2 text-left font-medium">Cantidad</th>
                <th className="w-[120px] px-3 py-2 text-left font-medium">Precio</th>
                <th className="w-16 px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, idx) => (
                <tr key={idx}>
                <td className="px-3 py-3 text-xs font-medium text-slate-500">
                  {item.item_type === 'service' ? 'Servicio' : 'Producto'}
                </td>
                <td className="w-[22.5rem] overflow-visible px-3 py-3">
                  {item.item_type === 'service' ? (
                    <SearchSelect
                      required
                      placeholder="Selecciona servicio…"
                      options={(services ?? []).map((s) => ({
                        value: String(s.id),
                        label: s.name,
                      }))}
                      value={item.service_id?.toString() ?? ''}
                      onChange={(v) =>
                        v
                          ? selectService(idx, Number(v))
                          : update(idx, { service_id: null })
                      }
                    />
                  ) : (
                    <SearchSelect
                      required
                      placeholder="Selecciona producto…"
                      options={(products ?? []).map((p) => ({
                        value: String(p.id),
                        label: p.name,
                      }))}
                      value={item.product_id?.toString() ?? ''}
                      onChange={(v) =>
                        v
                          ? selectProduct(idx, Number(v))
                          : update(idx, { product_id: null })
                      }
                    />
                  )}
                </td>
                <td className="w-64 overflow-visible px-3 py-3">
                  {item.item_type === 'service' ? (
                    <SearchSelect
                      placeholder="Sin asignar"
                      options={(users ?? []).map((u) => ({
                        value: String(u.id),
                        label: u.name,
                      }))}
                      value={item.assigned_to?.toString() ?? ''}
                      onChange={(v) =>
                        update(idx, { assigned_to: v ? Number(v) : null })
                      }
                    />
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
                <td className="min-w-[120px] px-3 py-3">
                  <input
                    type="number"
                    min={1}
                    className={`${inputCls} w-full`}
                    value={item.quantity}
                    onChange={(e) =>
                      update(idx, { quantity: Math.max(1, toNumber(e.target.value)) })
                    }
                  />
                </td>
                <td className="min-w-[120px] px-3 py-3">
                  <div className="relative w-full">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${inputCls} w-full pr-5`}
                      value={item.unit_price}
                      onChange={(e) => update(idx, { unit_price: toNumber(e.target.value) })}
                    />
                    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">€</span>
                  </div>
                </td>
                <td className="w-16 px-3 py-3 text-right">
                  <button type="button" onClick={() => remove(idx)} className="text-red-600 hover:text-red-800">
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={addService} className={btnGhost}>
          + Añadir servicio
        </button>
        <button type="button" onClick={addProduct} className={btnGhost}>
          + Añadir producto
        </button>
      </div>
    </div>
  )
}
