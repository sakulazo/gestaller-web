// Instante del próximo reinicio de la demo de Gestaller: el minuto 5 de cada hora
// impar (01:05, 03:05, ... 23:05), que es lo que dispara
// systemd/gestaller-demo-reset.timer en el VPS. Se calcula en el cliente porque el
// horario es fijo y no hay nada que el servidor sepa y el cliente no.
//
// LA HORA ES LA DEL SERVIDOR, NO LA DEL NAVEGADOR.
// El timer de systemd corre en la zona del VPS (Europe/Berlin, mismo offset que
// Europe/Madrid). Calcular el próximo reset con las horas locales de quien mira
// daría una cuenta atrás correcta solo para un visitante en ese huso, y
// equivocada en todos los demás: el banner mentiría justo sobre lo que avisa.
// Por eso la hora de reloj se lee con Intl en esa zona, y el instante se
// corrige una vez leyendo la hora de reloj del resultado (un cambio de hora en
// verano cae a las 03:00, dentro de la ventana del reset, y el reloj se
// equivoca por una hora justo ahí).

const RESET_TIMEZONE = 'Europe/Madrid'
const RESET_HOUR_STEP = 2
const RESET_MINUTE = 5

interface Reloj {
  year: number
  month: number
  day: number
  hour: number
  minute: number
}

const PARTE = new Intl.DateTimeFormat('en-CA', {
  timeZone: RESET_TIMEZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

// Hora de reloj de `instante` en la zona del reset. `hourCycle: 'h23'` (y no
// hour12:false, que en algunos motores devuelve 24 para medianoche) es lo que
// hace que la medianoche sea 0 y no 24, que rompería el cálculo de horas.
function relojEnZonaReset(instante: Date): Reloj {
  const partes = Object.fromEntries(
    PARTE.formatToParts(instante).map((p) => [p.type, p.value]),
  )
  return {
    year: Number(partes.year),
    month: Number(partes.month),
    day: Number(partes.day),
    hour: Number(partes.hour),
    minute: Number(partes.minute),
  }
}

// Los mismos campos de reloj, pero como milisegundos naivos (los de un Date
// con los que devuelve `new Date(y, m, d)` antes de aplicar el offset). La
// diferencia con el instante real es exactamente el offset de la zona.
function relojComoMillis(r: Reloj): number {
  return Date.UTC(r.year, r.month - 1, r.day, r.hour, r.minute, 0, 0)
}

export function nextDemoReset(from: Date = new Date()): Date {
  const ahora = relojEnZonaReset(from)
  let hora = ahora.hour

  // Pasado el minuto del reset, la hora impar de este mismo día ya no vale.
  if (ahora.minute >= RESET_MINUTE) hora += 1
  if (hora % RESET_HOUR_STEP === 0) hora += 1

  // `Date.UTC` con hora 24 o mayor salta al día siguiente por su cuenta, que es
  // lo que hace falta al pasar de las 23:05 a las 01:05.
  const objetivo = Date.UTC(ahora.year, ahora.month - 1, ahora.day, hora, RESET_MINUTE)

  // Primera aproximación: se supone el offset que la zona tiene ahora mismo.
  const offset = relojComoMillis(ahora) - from.getTime()
  const instante = new Date(objetivo - offset)

  // Corrección: se lee la hora de reloj del resultado y se ajusta la diferencia.
  // Con el offset correcto sale cero; si el reloj ha cambiado entre medias (el
  // cambio de hora de verano), sale la hora que falta y se corrige.
  //
  // `hora % 24` y el ajuste al representative mas cercano son IMPRESCINDIBLES,
  // no cosmeticos: al cruzar la medianoche `hora` vale 24 o 25, y comparar eso
  // contra la hora leida (siempre 0..23) producia una diferencia de 24 h que
  // empujaba el reset al dia siguiente (a las 23:59 el proximo reset caia a las
  // 01:05 del dia SIGUIENTE, con un reset de por medio).
  const leido = relojEnZonaReset(instante)
  let deltaMin = ((hora % 24) * 60 + RESET_MINUTE) - (leido.hour * 60 + leido.minute)
  if (deltaMin > 12 * 60) deltaMin -= 24 * 60
  else if (deltaMin < -12 * 60) deltaMin += 24 * 60
  return deltaMin === 0
    ? instante
    : new Date(instante.getTime() + deltaMin * 60_000)
}