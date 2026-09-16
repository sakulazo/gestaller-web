// Tabla de datos genérica para las páginas de listado.
//
// Al hacer click en una fila se invoca `onRowClick` (si se provee).

import { type ReactNode } from 'react'

const alignCls = (align?: Column<unknown>['align']) =>
  align === 'right'
    ? 'text-right'
    : align === 'center'
      ? 'text-center'
      : 'text-left'

export interface Column<T> {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  render?: (row: T) => ReactNode
}

export interface TablePagination {
  page: number
  totalPages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  rowKey?: (row: T) => string | number
  /** Alineación de los títulos de las cabeceras (por defecto, la de cada columna). */
  headerAlign?: 'left' | 'center' | 'right'
  pagination?: TablePagination
}

export default function DataTable<T>({
  columns,
  rows,
  onRowClick,
  rowKey,
  headerAlign,
  pagination,
}: DataTableProps<T>) {
  const page = pagination?.page ?? 1
  const totalPages = pagination?.totalPages ?? 1
  const total = pagination?.total ?? 0
  const pageSize = pagination?.pageSize ?? 20
  const onPageChange = pagination?.onPageChange ?? (() => {})
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)
  return (
    <div className="overflow-x-auto rounded bg-white shadow">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={`px-4 py-2 font-medium uppercase ${alignCls(headerAlign ?? c.align)}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, idx) => (
            <tr
              key={rowKey ? rowKey(row) : idx}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'cursor-pointer hover:bg-slate-50' : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-2 ${alignCls(c.align)}`}>
                  {c.render
                    ? c.render(row)
                    : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-4 text-center text-slate-400"
              >
                Sin datos
              </td>
            </tr>
          )}
        </tbody>
        {pagination && (
          <tfoot>
            <tr>
              <td
                colSpan={columns.length}
                className="border-t border-slate-200 px-4 py-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Mostrando {start}–{end} de {total}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => onPageChange(page - 1)}
                      className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => onPageChange(page + 1)}
                      className="rounded border border-slate-300 px-3 py-1 text-sm disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}
