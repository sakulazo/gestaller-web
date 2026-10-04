// Banner de la demo: aviso de que los datos se reinician, cuenta atrás y
// credenciales de entrada. Se monta en Login y en Layout.
//
// Aparece en las dos pantallas a proposito: Login es lo primero que ve quien
// abre la demo (y donde hay que explicar que lo que cree no se conserva), y
// Layout para que siga visible despues de iniciar sesion, que es cuando empieza
// a crearse datos que se van a perder.

import { useEffect, useState } from 'react'
import { nextDemoReset } from '../lib/demoReset'

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `${pad(hours)}:${pad(minutes)}:${pad(total % 60)}`
}

export default function DemoBanner() {
  const [remaining, setRemaining] = useState(
    () => nextDemoReset().getTime() - Date.now(),
  )

  useEffect(() => {
    const id = setInterval(() => {
      const diff = nextDemoReset().getTime() - Date.now()
      setRemaining(diff)
      // Al llegar a cero el backend esta recreando la base de datos: recargar
      // evita que la primera peticion que haga el visitante caiga en un 502.
      if (diff <= 0) window.location.reload()
      //
      // OJO: la recarga solo ocurre en este tick. Tras recargar, la cuenta atras
      // se recalcula al PROXIMO reset (unas horas despues), asi que no avisa de
      // que la demo siga caida: eso lo dice ya el 502 de la propia peticion, que
      // es la senal que el visitante puede ver, en vez de un contador que
      // miente.
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p>
        <strong>Demo.</strong> Los datos se reinician en{' '}
        <span className="font-mono font-semibold">{formatRemaining(remaining)}</span>. Lo que
        crees aquí no se conserva.
      </p>
      <p className="mt-1">
        Entrar con <code>admin</code> / <code>admin123</code>.
      </p>
    </div>
  )
}