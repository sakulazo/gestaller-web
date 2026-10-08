// Ventana modal genérica.

import type { ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  /** Contenido bajo el título (p. ej. el badge de estado). */
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  /** Modal apilado sobre otro modal: z-index superior y fondo más suave. */
  stacked?: boolean
  /** Hace el modal un 25% más ancho (max-w-4xl → max-w-5xl). */
  wide?: boolean
}

export default function Modal({ open, title, subtitle, onClose, children, stacked, wide }: ModalProps) {
  if (!open) return null
  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 backdrop-blur-sm ${
        stacked ? 'z-[60] bg-slate-900/50' : 'bg-slate-900/60'
      }`}
    >
      <div className={`my-8 w-full animate-scale-in rounded bg-white p-6 shadow-xl ${wide ? 'max-w-5xl' : 'max-w-4xl'}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="flex items-center gap-3 text-page-title font-bold text-slate-900">
              <span aria-hidden className="h-6 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span className="min-w-0">{title}</span>
            </h2>
            {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
          </div>
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
