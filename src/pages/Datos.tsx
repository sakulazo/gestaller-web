// Página de datos crudos: muestra todas las tablas como fichas de solo lectura.
// 100% crudo: nombres de tabla y cabeceras tal cual en la BD, valores sin formatear.
// Los registros con soft delete se muestran en rojo con badge "Borrado".

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTableData } from '../services'

const TABLES = [
  'users',
  'roles',
  'permissions',
  'user_roles',
  'role_permissions',
  'clients',
  'vehicle_categories',
  'vehicles',
  'service_categories',
  'services',
  'product_categories',
  'products',
  'providers',
  'product_providers',
  'work_orders',
  'work_order_items',
  'quotes',
  'quote_items',
  'invoices',
  'invoice_items',
  'company_profiles',
]

function isDeleted(row: Record<string, unknown>): boolean {
  return row.deleted_at !== null && row.deleted_at !== undefined
}

function getColumns(rows: Record<string, unknown>[]): string[] {
  const cols: string[] = []
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!cols.includes(key)) cols.push(key)
    }
  }
  return cols
}

function renderValue(val: unknown): string {
  if (val === null || val === undefined) return 'null'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

function TableSection({ table }: { table: string }) {
  const [open, setOpen] = useState(false)
  const query = useQuery({
    queryKey: ['datos', table],
    queryFn: () => fetchTableData(table),
    enabled: open,
  })

  const data: Record<string, unknown>[] = (query.data ?? []) as Record<string, unknown>[]
  const deletedCount = data.filter(isDeleted).length
  const columns = useMemo(() => getColumns(data), [data])

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-mono text-sm font-medium text-slate-800">{table}</span>
        <span className="flex items-center gap-3">
          {open && query.isLoading && (
            <span className="text-xs text-slate-400">Cargando…</span>
          )}
          {open && !query.isLoading && (
            <>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                {data.length}
              </span>
              {deletedCount > 0 && (
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-500">
                  {deletedCount} borrado{deletedCount !== 1 ? 's' : ''}
                </span>
              )}
            </>
          )}
          <span className="text-slate-400">{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 pb-3">
          {query.isLoading ? (
            <p className="py-4 text-sm text-slate-400">Cargando…</p>
          ) : data.length === 0 ? (
            <p className="py-4 text-sm text-slate-400">Sin registros</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-medium text-slate-500">
                    {columns.map((col) => (
                      <th key={col} className="whitespace-nowrap px-3 py-2 font-mono">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row: Record<string, unknown>, i: number) => {
                    const deleted = isDeleted(row)
                    return (
                      <tr
                        key={i}
                        className={`border-b last:border-0 ${
                          deleted
                            ? 'bg-red-50 text-red-700'
                            : 'border-slate-50'
                        }`}
                      >
                        {columns.map((col) => (
                          <td
                            key={col}
                            className={`whitespace-nowrap px-3 py-1.5 font-mono ${
                              row[col] === null || row[col] === undefined
                                ? 'text-slate-400'
                                : ''
                            }`}
                          >
                            {renderValue(row[col])}
                          </td>
                        ))}
                        {deleted && (
                          <td className="whitespace-nowrap px-3 py-1.5">
                            <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-600">
                              Borrado
                            </span>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Datos() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return TABLES
    const q = search.toLowerCase()
    return TABLES.filter((t) => t.toLowerCase().includes(q))
  }, [search])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Datos</h1>
      <input
        type="text"
        placeholder="Buscar tabla…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
      />
      <div className="space-y-2">
        {filtered.map((t) => (
          <TableSection key={t} table={t} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400">
            No se encontraron tablas.
          </p>
        )}
      </div>
    </div>
  )
}
