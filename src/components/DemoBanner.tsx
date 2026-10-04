// Banner de la demo: aviso de que los datos se reinician, cuenta atrás y
// credenciales de entrada. Se monta en Login y en Layout.
//
// Aparece en las dos pantallas a proposito: Login es lo primero que ve quien
// abre la demo (y donde hay que explicar que lo que cree no se conserva), y
// Layout para que siga visible despues de iniciar sesion, que es cuando empieza
// a crearse datos que se van a perder.
//
// Y SOLO en la demo, y por un flag de CONSTRUCCION y no por el hostname. Los dos
// stacks se construyen desde ESTE MISMO repo (`deploy-gestaller.timer` reconstruye
// produccion cada 5 minutos con el mismo commit), y un banner sin gate aparece
// tambien en gestaller.sakulazo.com anunciando un reset que alli no ocurre y
// enseñando las credenciales. Pasó de verdad el 2026-10-04.
//
// El flag va en `VITE_DEMO_BANNER` y lo pone el stack de la demo al construir
// (scripts/build-gestaller-demo-web.sh -> --build-arg VITE_DEMO_BANNER=1); en
// produccion vale lo mismo que no exista. Vite lo sustituye por una constante en
// tiempo de build, asi que la rama se PLEGADA y el banner entero desaparece del
// bundle de produccion: no es que no se pinte, es que no esta. Por eso se
// comprueba con `grep` en los dos sentidos y no con un navegador.
import { useEffect, useState } from 'react'
import { nextDemoReset } from '../lib/demoReset'

const ES_DEMO = import.meta.env.VITE_DEMO_BANNER === '1'

function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  return `${pad(hours)}:${pad(minutes)}:${pad(total % 60)}`
}

export default function DemoBanner() {
  const esDemo = ES_DEMO
  const [remaining, setRemaining] = useState(
    () => nextDemoReset().getTime() - Date.now(),
  )

  useEffect(() => {
    // En produccion no hay cuenta atras que correr: el return temprano va DEBAJO
    // de los hooks (si no, se cambia el numero de hooks entre renders), pero el
    // efecto si se puede no montar.
    if (!esDemo) return
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
  }, [esDemo])

  // Return temprano DESPUES de los hooks: si se saliera antes, el numero de
  // hooks dependeria del hostname y React lo protestaria.
  if (!esDemo) return null

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