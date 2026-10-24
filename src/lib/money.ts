// Helpers de dinero para el contrato de la API.
//
// La API viaja con importes como strings decimales canónicos ("1250.30").
// Toda aritmética se hace en ENTEROS DE CÉNTIMOS para reproducir exactamente
// el redondeo half-up del backend (nunca con floats).
//
// formatMoney es tolerante (acepta string | number) para sobrevivir a una
// ventana de despliegue donde backend y frontend no coinciden aún.

const TWO_DECIMALS = /^\d{1,8}(\.\d{1,2})?$/

/** Convierte un importe de la API a céntimos enteros de forma exacta. */
export function toCents(value: string | number): number {
  if (typeof value === 'number') {
    // Tolerante: legacy u otro cliente que aún envíe números.
    return Math.round(value * 100)
  }
  const text = value.trim().replace(',', '.')
  if (!TWO_DECIMALS.test(text)) return 0
  const [intPart = '0', decPart = ''] = text.split('.')
  const decimals = (decPart + '00').slice(0, 2)
  return Number(intPart) * 100 + Number(decimals)
}

/** Formatea un importe de la API para mostrarlo en euros (es-ES). */
export function formatMoney(value: string | number | null | undefined): string {
  const cents = value == null ? 0 : toCents(value)
  return formatCents(cents)
}

/** Formatea un valor ya calculado en céntimos enteros. */
export function formatCents(cents: number): string {
  const formatted = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
  return `${formatted} €`
}

/**
 * Normaliza la entrada del usuario a string decimal canónico para el
 * payload: coma → punto, sin caracteres extra, máximo 2 decimales.
 * Devuelve '' si la entrada está vacía o es inválida.
 */
export function normalizeMoneyInput(raw: string): string {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.').replace(/[^0-9.]/g, '')
  if (!cleaned) return ''
  const [intPart = '', decPart = ''] = cleaned.split('.')
  const int = intPart.slice(0, 8)
  const dec = decPart.slice(0, 2)
  if (!int) return ''
  return dec ? `${int}.${dec}` : int
}

/**
 * Importe de una línea en céntimos: cantidad × precio × (1 − descuento%).
 * Reproduce EXACTAMENTE la fórmula half-up del backend
 * (app/core/money.py: importe_linea) con aritmética entera.
 */
export function lineCents(
  quantity: number,
  unitPrice: string | number,
  discountPct: number,
): number {
  const priceCents = toCents(unitPrice)
  const numerator = quantity * priceCents * (100 - discountPct)
  return Math.floor((numerator + 50) / 100)
}

/** Importe de una línea formateado (atajo para previews de formularios). */
export function formatLine(
  quantity: number,
  unitPrice: string | number,
  discountPct: number,
): string {
  return formatMoney((lineCents(quantity, unitPrice, discountPct) / 100).toFixed(2))
}
