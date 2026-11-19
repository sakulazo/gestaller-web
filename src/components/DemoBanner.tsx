// Banner de la demo: aviso de que los datos se reinician, cuenta atrás y
// credenciales de entrada. Se monta en Layout (sesión iniciada).
//
// Se muestra SOLO en un taller de demostración (`DEMO_TENANTS`), y se decide
// en tiempo de EJECUCIÓN por el slug del taller de la sesión, no por el
// hostname ni por un flag de build: la demo ya no es un despliegue aparte, es
// un tenant dentro de producción. Un flag de construcción no serviría (los dos
// casos comparten bundle) y el hostname tampoco (el dominio de la demo
// desapareció). El usuario lo trae `/auth/me` y `useAuth` lo refresca.
//
// En el login no se pinta: sin sesión no hay taller que comprobar. Allí hay un
// enlace «Probar la demo» que entra con las credenciales públicas (ver Login).
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_TENANTS } from '../lib/demo'
import { nextDemoReset } from '../lib/demoReset'

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `${pad(hours)}:${pad(minutes)}:${pad(total % 60)}`
}

export default function DemoBanner() {
  const { user } = useAuth()
  const slug = user?.tenant?.slug
  const tenantName = user?.tenant?.name ?? slug
  const esDemo = slug ? (DEMO_TENANTS as readonly string[]).includes(slug) : false
  const [remaining, setRemaining] = useState(
    () => nextDemoReset().getTime() - Date.now(),
  )
  // Instante del reset que esta contando el tick anterior. Es lo que permite
  // notar que se ha pasado uno: ver el comentario del reload mas abajo.
  const ultimoObjetivo = useRef<number | null>(null)

  useEffect(() => {
    // Fuera del taller demo no hay cuenta atrás que correr: el return temprano
    // va DEBAJO de los hooks (si no, se cambia el numero de hooks entre
    // renders), pero el efecto si se puede no montar.
    if (!esDemo) return
    const id = setInterval(() => {
      const ahora = Date.now()
      const objetivo = nextDemoReset(new Date(ahora)).getTime()
      setRemaining(objetivo - ahora)

      // Al LLEGAR el reset el script borra los datos y vuelve a sembrarlos:
      // recargar evita que la primera petición caiga a mitad del proceso.
      //
      // Se detecta por el CAMBIO DE OBJETIVO, no por `diff <= 0`.
      // `nextDemoReset()` devuelve siempre un instante futuro, así que `diff`
      // salta de ~0 a 6 h sin pasar por cero y una recarga por `diff <= 0` no
      // ocurre NUNCA. Comparar el objetivo de ahora con el del tick anterior
      // sí que se ve: si ha cambiado, es que se ha pasado un reset.
      if (ultimoObjetivo.current !== null && objetivo !== ultimoObjetivo.current) {
        window.location.reload()
        return
      }
      ultimoObjetivo.current = objetivo
    }, 1000)
    return () => clearInterval(id)
  }, [esDemo])

  // Return temprano DESPUES de los hooks: si se saliera antes, el numero de
  // hooks dependeria del taller y React lo protestaria.
  if (!esDemo) return null

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>
        <strong>Demo.</strong> Los datos se reinician en{' '}
        <span className="font-mono font-semibold">{formatRemaining(remaining)}</span>. Lo que
        crees aquí no se conserva.
      </p>
      <p className="mt-1">
        Entrar con <code>{DEMO_EMAIL}</code> / <code>{DEMO_PASSWORD}</code> (taller{' '}
        <code>{tenantName}</code>).
      </p>
    </div>
  )
}