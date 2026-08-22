// Error Boundary global — captura errores de renderizado y muestra una
// pantalla amigable en lugar de crashear toda la aplicación.

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow">
            <h1 className="mb-2 text-xl font-bold text-red-700">
              Algo salio mal
            </h1>
            <p className="mb-4 text-sm text-slate-600">
              Ha ocurrido un error inesperado. Por favor, recarga la pagina.
            </p>
            <p className="mb-4 rounded bg-red-50 p-3 text-xs text-red-600">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-slate-800 px-4 py-2 text-sm text-white hover:bg-slate-700"
            >
              Recargar pagina
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
