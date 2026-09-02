// Ventana modal genérica.

import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** Modal apilado sobre otro modal: z-index superior y fondo más suave. */
  stacked?: boolean
  /** Hace el modal un 25% más ancho (max-w-4xl → max-w-5xl). */
  wide?: boolean
}

export default function Modal({ open, title, onClose, children, stacked, wide }: ModalProps) {
  if (!open) return null
  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 ${
        stacked ? 'z-[60] bg-slate-900/40' : 'bg-slate-900/50'
      }`}
    >
      <div className={`my-8 w-full animate-scale-in rounded bg-white p-6 shadow-xl ${wide ? 'max-w-5xl' : 'max-w-4xl'}`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
