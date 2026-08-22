// Sistema de notificaciones toast (comunicación con el usuario).
//
// - `ToastProvider` envuelve la app y renderiza las notificaciones.
// - `useToast()` expone success/error/info dentro de componentes React.
// - `emitToast()` permite lanzar toasts desde fuera de React (p. ej. el
//   interceptor de axios) sin depender del contexto.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  message: string
}

type Listener = (toast: ToastItem) => void

const DURATION_MS = 5000

let nextId = 1
const listeners = new Set<Listener>()

export function emitToast(type: ToastType, message: string) {
  const toast: ToastItem = { id: nextId++, type, message }
  listeners.forEach((l) => l(toast))
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const typeStyles: Record<ToastType, string> = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  error: 'border-red-300 bg-red-50 text-red-800',
  info: 'border-slate-300 bg-white text-slate-700',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const listener: Listener = (toast) => {
      setToasts((prev) => [...prev, toast])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id))
      }, DURATION_MS)
    }
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo<ToastApi>(
    () => ({
      success: (m) => emitToast('success', m),
      error: (m) => emitToast('error', m),
      info: (m) => emitToast('info', m),
    }),
    [],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start justify-between gap-2 rounded border px-4 py-3 text-sm shadow-lg ${typeStyles[t.type]}`}
          >
            <span className="break-words">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="text-current opacity-60 hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return ctx
}
