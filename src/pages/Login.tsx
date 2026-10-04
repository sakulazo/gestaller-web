// Página de inicio de sesión.
//
// En desktop (>= md) se parte en dos columnas: panel de marca a la izquierda y
// tarjeta del formulario a la derecha. Por debajo el panel se oculta y el logo
// sube sobre la tarjeta, de modo que solo aparece una vez en cada tamaño.

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CircleAlert,
  ClipboardList,
  Eye,
  EyeOff,
  LoaderCircle,
  Lock,
  ReceiptEuro,
  ShieldCheck,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { toApplicationError } from '../types/errors'
import Brand from '../components/Brand'

const highlights: { icon: LucideIcon; text: string }[] = [
  { icon: ClipboardList, text: 'Órdenes de trabajo, check-in y entrega' },
  { icon: ReceiptEuro, text: 'Presupuestos, facturas y recambios' },
  { icon: ShieldCheck, text: 'Usuarios, roles y permisos por módulo' },
]

const labelCls = 'mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500'
const inputCls =
  'w-full rounded-lg border border-slate-300 py-2.5 pl-10 text-sm text-slate-900 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30'
const iconCls = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  const errorProps = {
    'aria-invalid': !!error || undefined,
    'aria-describedby': error ? 'login-error' : undefined,
  }

  return (
    <div className="grid min-h-screen overflow-hidden bg-slate-900 px-4 text-slate-100 sm:px-8 md:grid-cols-2 lg:px-20">
      {/* Sin `overflow-hidden`: el halo inferior derecho se derrama hacia la
          columna del formulario en vez de cortarse contra el panel. El recorte
          se hace en la raíz, ya en el borde de la ventana. */}
      <aside className="relative hidden flex-col justify-between p-10 md:flex lg:p-12">
        {/* Halos y aro decorativos: nunca capturan clics ni van al árbol accesible. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="absolute -bottom-40 -right-28 h-[30rem] w-[30rem] rounded-full bg-amber-300/5 blur-3xl" />
          <div className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <Brand variant="on-dark" withWordmark symbolClassName="h-40" className="text-6xl" />
        </div>

        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-white lg:text-4xl">
            El taller y el lavadero, en una sola pantalla
          </p>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Órdenes de trabajo, presupuestos y facturación con el control de
            permisos de tu taller.
          </p>
          <ul className="mt-8 space-y-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/10 text-amber-300">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="flex items-center justify-center py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center md:hidden">
            <Brand variant="on-dark" withWordmark symbolClassName="h-36" className="text-3xl" />
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-xl bg-white p-7 shadow-2xl shadow-slate-950/40 ring-1 ring-slate-900/5 sm:p-8"
          >
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Accede con tu usuario del taller.
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <label htmlFor="username" className={labelCls}>Usuario</label>
                <div className="relative">
                  <User className={iconCls} aria-hidden="true" />
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoFocus
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value)
                      setError('')
                    }}
                    {...errorProps}
                    className={`${inputCls} pr-3`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className={labelCls}>Contraseña</label>
                <div className="relative">
                  <Lock className={iconCls} aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setError('')
                    }}
                    {...errorProps}
                    className={`${inputCls} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div
                  id="login-error"
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading && (
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Acceso restringido a personal autorizado
          </p>
        </div>
      </main>
    </div>
  )
}