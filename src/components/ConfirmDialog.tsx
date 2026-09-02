// Diálogo de confirmación genérico (borrados y acciones destructivas).

import type { ReactNode } from 'react'
import Modal from './Modal'
import { btnGhost } from './ui'

interface ConfirmDialogProps {
  open: boolean
  title?: string
  message?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  stacked?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title = 'Confirmar',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  stacked,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} title={title} onClose={onCancel} stacked={stacked}>
      <div className="text-sm text-slate-600">{message}</div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={btnGhost}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={
            danger
              ? 'rounded bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-500 disabled:opacity-50'
              : 'rounded bg-emerald-600 px-4 py-2 text-sm text-white hover:bg-emerald-500 disabled:opacity-50'
          }
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
