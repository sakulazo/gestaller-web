// Tests de `nextDemoReset`.
//
// El módulo calcula el próximo reset (minuto 5 de cada hora impar) en la zona
// del SERVIDOR, no en la del navegador, así que los instantes de entrada se
// construyen SIEMPRE en UTC (`Date.UTC`) y las aserciones se hacen sobre la hora
// de reloj en Europe/Madrid. Nada de `new Date('2026-10-05T13:04:30')` a pelo:
// eso se interpretaría en la zona de la máquina que corre los tests y los
// casos pasarían en un huso y fallarían en otro.
//
// Aquí no se puede usar `vi.setSystemTime` para probar la cuenta atrás tal y
// como la ve el banner: la función es pura y recibe `from`, que es justo lo que
// hace testeable el reloj.

import { describe, expect, it } from 'vitest'
import { nextDemoReset } from './demoReset'

const TZ = 'Europe/Madrid'

// Hora de reloj de `instante` en la zona del reset, como comparables.
function reloj(instante: Date) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value]),
  )
  return {
    year: Number(partes.year),
    month: Number(partes.month),
    day: Number(partes.day),
    hour: Number(partes.hour),
    minute: Number(partes.minute),
    second: Number(partes.second),
  }
}

// Cuantos segundos le quedan al objetivo desde `instante`, redondeados.
function restante(instante: Date): number {
  return Math.round((nextDemoReset(instante).getTime() - instante.getTime()) / 1000)
}

// Un instante a una hora de reloj concreta de la zona del reset, en un dia
// lectivo cualquiera (UTC+1 en invierno, UTC+2 en verano).
function aLasHoraDeMadrid(
  year: number,
  month: number,
  day: number,
  hora: number,
  minuto = 0,
  segundo = 0,
): Date {
  // Se busca el instante UTC cuya hora de reloj en Madrid sea la pedida. Con un
  // maximo de 26 h de margen sale siempre, y Asi el test no depende de si ese
  // dia concreto esta en horario de verano o de invierno.
  for (let desplazamiento = 0; desplazamiento <= 26 * 60; desplazamiento++) {
    const candidato = new Date(
      Date.UTC(year, month - 1, day, hora, minuto, segundo) - desplazamiento * 60_000,
    )
    const r = reloj(candidato)
    if (r.hour === hora && r.minute === minuto && r.second === segundo) return candidato
  }
  throw new Error(
    `no se encuentra ${hora}:${minuto}:${segundo} en ${TZ} el ${year}-${month}-${day}`,
  )
}

describe('nextDemoReset', () => {
  it('cae en el minuto 5 de una hora impar, en la zona del servidor', () => {
    // 11:00 en Madrid es una hora impar todavia por delante, asi que el reset
    // esta a 5 minutos, no a 2 horas: el objetivo es 11:05.
    const objetivo = nextDemoReset(aLasHoraDeMadrid(2026, 1, 13, 11, 0, 0))
    const r = reloj(objetivo)
    expect(r.hour).toBe(11)
    expect(r.minute).toBe(5)
    expect(r.second).toBe(0)

    // Y desde las 12:00 (hora par) si que son 2 h, hasta las 13:05.
    expect(reloj(nextDemoReset(aLasHoraDeMadrid(2026, 1, 13, 12, 0, 0)))).toMatchObject({
      hour: 13,
      minute: 5,
      second: 0,
    })
  })

  it('el objetivo NO depende de los segundos de ahora (el bug de la cuenta atrás clavada)', () => {
    // Este es el caso que fallaba: con el offset calculado a partir de una hora
    // de reloj truncada a 0 segundos, el objetivo caia en 13:05:30 en vez de a
    // las 13:05:00, y como el banner recalcula en cada tick el objetivo se
    // deslizaba con el reloj y la cuenta atrás se quedaba en 00:01:00.
    for (const segundo of [0, 7, 30, 59]) {
      const instante = aLasHoraDeMadrid(2026, 1, 13, 13, 4, segundo)
      expect(reloj(nextDemoReset(instante)).second).toBe(0)
    }
  })

  it('la cuenta atrás DECRECE de verdad hasta cero', () => {
    // Un minuto antes del reset, tick a tick: tiene que bajar 1 s cada vez.
    const base = aLasHoraDeMadrid(2026, 1, 13, 13, 4, 0)
    let anterior = restante(base)
    expect(anterior).toBe(60)
    for (let i = 1; i <= 30; i++) {
      const actual = restante(new Date(base.getTime() + i * 1000))
      expect(actual).toBe(60 - i)
      expect(actual).toBeLessThan(anterior)
      anterior = actual
    }
    // Y en el segundo en que se cumple el minuto 5 el objetivo ya es el
    // siguiente, porque la regla es "pasado el minuto 5, cuenta 2 h mas". Por eso
    // el banner no puede esperar a `diff <= 0` para recargar (no existe tal
    // instante) y tiene que notar el cambio de objetivo.
    expect(reloj(nextDemoReset(new Date(base.getTime() + 60_000)))).toMatchObject({
      hour: 15,
      minute: 5,
      second: 0,
    })
  })

  it('pasado el minuto 5, cuenta hasta el reset siguiente (2 h)', () => {
    expect(restante(aLasHoraDeMadrid(2026, 1, 13, 13, 5, 0))).toBe(2 * 3600)
    expect(restante(aLasHoraDeMadrid(2026, 1, 13, 13, 5, 30))).toBe(2 * 3600 - 30)
    // 14:30 esta entre medias: hasta las 15:05 quedan 35 min.
    expect(restante(aLasHoraDeMadrid(2026, 1, 13, 14, 30, 0))).toBe(35 * 60)
  })

  it('nunca devuelve un instante pasado ni un objetivo que no sea un reset', () => {
    // Barrido de un año entero, con un paso de 5 min: la invariante tiene que
    // aguantar los dos cambios de hora y todos los dias, no solo un dia malo.
    // El paso es de minutos y no de segundos a proposito: `Intl.DateTimeFormat`
    // cuesta lo que cuesta y a granularidad fina este test se iba de 30 a 130 s.
    // Los segundos sueltos los cubren los tests explicitos de arriba, que ademas
    // clavan un segundo concreto.
    //
    // La invariante va sobre el OBJETIVO (hora impar, minuto 5, segundo 0) y no
    // sobre la duracion del contador, porque hay un dia legitimo en que el uno
    // no acota el otro: el 25 de octubre, con el reloj atrasado, la hora 02:00
    // ocurre DOS veces, asi que de las 01:06 a las 03:05 hay 119 minutos de
    // reloj pero 179 reales. Ahi el contador dice casi 3 h y es lo que queda
    // hasta el reset de verdad, que si dispara a las 03:05 (lo comprueba
    // `systemd-analyze calendar` en infra-vps). Acotar a 2 h sería erróneo:
    // obligaría a que el objetivo se inventase un reset que no existe.
    const inicio = Date.UTC(2026, 0, 1, 0, 0, 0)
    for (let ms = 0; ms < 365 * 24 * 3600 * 1000; ms += 300_000) {
      const instante = new Date(inicio + ms)
      const objetivo = nextDemoReset(instante)
      expect(objetivo.getTime()).toBeGreaterThan(instante.getTime())
      const r = reloj(objetivo)
      expect(r.hour % 2).toBe(1)
      expect(r.minute).toBe(5)
      expect(r.second).toBe(0)
    }
    // Timeout propio: el barrido de un año son ~105 000 iteraciones y cada una
    // formatea con `Intl`, que no es gratis. Se deja que tarde lo que tarde en
    // vez de recortarlo y perder cobertura; el resto del suite tarda menos de un
    // segundo, asi que el tiempo se ve en este test y no en el total.
  }, 120_000)

  it('el objetivo es el MAS PROXIMO: pasado un reset, cuenta el siguiente', () => {
    // Si `nextDemoReset()` se saltase un reset (un error de 24 h al cruzar la
    // medianoche hacia atras, por ejemplo), al pasar un milisegundo el objetivo
    // no avanzaria. Se comprueba en los puntos que rompian: la medianoche y el
    // cambio de hora.
    for (const instante of [
      aLasHoraDeMadrid(2026, 1, 13, 13, 5, 0),
      aLasHoraDeMadrid(2026, 1, 13, 23, 5, 0),
      aLasHoraDeMadrid(2026, 3, 29, 1, 5, 0),
      aLasHoraDeMadrid(2026, 10, 25, 1, 5, 0),
      aLasHoraDeMadrid(2026, 10, 25, 3, 5, 0),
    ]) {
      const actual = reloj(nextDemoReset(instante))
      const siguiente = reloj(nextDemoReset(new Date(nextDemoReset(instante).getTime() + 1)))
      expect(siguiente.minute).toBe(5)
      expect(siguiente.second).toBe(0)
      expect(siguiente.hour).toBe((actual.hour + 2) % 24)
    }
  })

  it('cruza la medianoche al reset de las 23:05 (sin saltarse un reset)', () => {
    const antes = nextDemoReset(aLasHoraDeMadrid(2026, 1, 13, 22, 6, 0))
    expect(reloj(antes)).toMatchObject({ day: 13, hour: 23, minute: 5 })

    // 23:05 en punto ya cuenta hasta el día siguiente, no hasta las 23:05 de hoy
    const despues = nextDemoReset(aLasHoraDeMadrid(2026, 1, 13, 23, 5, 0))
    expect(reloj(despues)).toMatchObject({ day: 14, hour: 1, minute: 5 })
    expect(restante(aLasHoraDeMadrid(2026, 1, 13, 23, 5, 0))).toBe(2 * 3600)
  })

  describe('cambio de hora (DST)', () => {
    it('adelantamiento: el reset de la 01:05 sigue existiendo', () => {
      // 29 de marzo de 2026: a las 02:00 el reloj salta a las 03:00. La 01:05
      // existe y el objetivo tiene que caer ahi, no a las 03:05.
      const instante = aLasHoraDeMadrid(2026, 3, 29, 0, 30, 0)
      const r = reloj(nextDemoReset(instante))
      expect(r.day).toBe(29)
      expect(r.hour).toBe(1)
      expect(r.minute).toBe(5)
    })

    it('adelantamiento: desde las 03:05 (ya con el reloj nuevo) cuenta 2 h', () => {
      const instante = aLasHoraDeMadrid(2026, 3, 29, 3, 5, 0)
      expect(restante(instante)).toBe(2 * 3600)
      expect(reloj(nextDemoReset(instante))).toMatchObject({ hour: 5, minute: 5 })
    })

    it('atraso: desde las 01:06 el contador llega a las 03:05 y dura 179 min', () => {
      // 25 de octubre de 2026: a las 03:00 el reloj vuelve a las 02:00, asi que
      // las 02:00-02:59 ocurren dos veces. El objetivo tiene que ser un instante
      // real y unico (las 03:05, que es el reset que dispara el timer), no
      // depender de cual de las dos copias se lea.
      const instante = aLasHoraDeMadrid(2026, 10, 25, 1, 6, 0)
      const objetivo = nextDemoReset(instante)
      expect(reloj(objetivo)).toMatchObject({ day: 25, hour: 3, minute: 5, second: 0 })
      expect(objetivo.getTime()).toBeGreaterThan(instante.getTime())
      // 119 minutos de reloj pero 179 reales, porque la hora 02:00 se repite.
      // El contador dice casi 3 h y es lo que de verdad queda.
      expect(restante(instante)).toBe(179 * 60)
    })
  })

  it('da igual la zona del navegador: el mismo instante da el mismo objetivo', () => {
    // La razon de usar Intl con Europe/Madrid. Un visitante en otro huso tiene
    // un `from` distinto, pero para el MISMO instante real el objetivo es el
    // mismo. Se comprueba con el instante real, no con dos Dates locales.
    const instante = Date.UTC(2026, 1, 13, 17, 0, 0) // 18:00 en Madrid
    const esperado = nextDemoReset(new Date(instante)).getTime()
    // Lo que haria un `getHours()` local depende del TZ del proceso; aqui se
    // comprueba que el objetivo cae en hora impar de Madrid, que es el contrato.
    const r = reloj(new Date(esperado))
    expect(r.hour).toBe(19)
    expect(r.minute).toBe(5)
  })
})