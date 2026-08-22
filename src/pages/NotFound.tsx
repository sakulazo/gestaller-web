// Página 404.

import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-bold text-slate-800">404</h1>
      <p className="mt-2 text-slate-500">La página no existe</p>
      <Link to="/" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
        Volver al inicio
      </Link>
    </div>
  )
}
