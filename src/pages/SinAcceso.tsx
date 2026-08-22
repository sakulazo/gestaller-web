// Página 403: sin permisos para el módulo.

import { Link } from 'react-router-dom'

export default function SinAcceso() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-bold text-slate-800">403</h1>
      <p className="mt-2 text-slate-500">
        No tienes permisos para acceder a este módulo
      </p>
      <Link to="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
