// Página de inicio de sesión.

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { toApplicationError } from '../types/errors'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      const appErr = toApplicationError(err)
      setError(appErr.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full max-w-sm rounded bg-white p-8 shadow"
      >
        <h1 className="mb-6 text-center text-2xl font-bold text-slate-800">
          Gestaller
        </h1>
        <label htmlFor="username" className="mb-2 block text-sm text-slate-600">Usuario</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        <label htmlFor="password" className="mb-2 block text-sm text-slate-600">Contrasena</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 text-sm"
        />
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-slate-800 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
