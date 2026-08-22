// Tabla de datos genérica para las páginas de listado.
//
// Las acciones Editar/Eliminar se ocultan si el usuario no tiene el permiso
// indicado (`editPermission` / `deletePermission`). Eliminar pide
// confirmación antes de ejecutarse.

import { useState, type ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import ConfirmDialog from './ConfirmDialog'

export interface Column<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  onDelete?: (row: T) => void
  onEdit?: (row: T) => void
  renderActions?: (row: T) => ReactNode
  rowKey?: (row: T) => string | number
  editPermission?: string
  deletePermission?: string
  deleteMessage?: (row: T) => string
  /** Predicado opcional por fila para ocultar "Eliminar" (ej. convertido). */
  canDelete?: (row: T) => boolean
}

export default function DataTable<T>({
  columns,
  rows,
  onDelete,
  onEdit,
  renderActions,
  rowKey,
  editPermission,
  deletePermission,
  deleteMessage,
  canDelete: canDeleteRow,
}: DataTableProps<T>) {
  const { can } = useAuth()
  const [pendingDelete, setPendingDelete] = useState<T | null>(null)

  const canEdit = Boolean(onEdit) && (!editPermission || can(editPermission))
  const baseCanDelete =
    Boolean(onDelete) && (!deletePermission || can(deletePermission))
  const hasActions = canEdit || baseCanDelete || Boolean(renderActions)

  const confirmDelete = () => {
    if (pendingDelete && onDelete) onDelete(pendingDelete)
    setPendingDelete(null)
  }

  return (
    <>
      <div className="overflow-x-auto rounded bg-white shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2 text-left font-medium">
                  {c.header}
                </th>
              ))}
              {hasActions && (
                <th className="px-4 py-2 text-left font-medium">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, idx) => (
              <tr key={rowKey ? rowKey(row) : idx}>
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2">
                    {c.render
                      ? c.render(row)
                      : String((row as Record<string, unknown>)[c.key] ?? '')}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-4 py-2">
                    {canEdit && (
                      <button
                        onClick={() => onEdit?.(row)}
                        className="mr-3 text-blue-600 hover:text-blue-800"
                      >
                        Editar
                      </button>
                    )}
                    {renderActions && renderActions(row)}
                    {baseCanDelete && (!canDeleteRow || canDeleteRow(row)) && (
                      <button
                        onClick={() => setPendingDelete(row)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="px-4 py-4 text-center text-slate-400"
                >
                  Sin datos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Confirmar eliminación"
        message={
          pendingDelete
            ? deleteMessage?.(pendingDelete) ??
              '¿Seguro que deseas eliminar este registro? Esta acción no se puede deshacer.'
            : ''
        }
        confirmLabel="Eliminar"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
