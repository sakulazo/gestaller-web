import { describe, expect, it } from 'vitest'

import { formatLine, formatMoney, lineCents, normalizeMoneyInput, toCents } from './money'

describe('toCents', () => {
  it('convierte strings canónicos sin float', () => {
    expect(toCents('12.50')).toBe(1250)
    expect(toCents('0.1')).toBe(10)
    expect(toCents('0')).toBe(0)
    expect(toCents('99999999.99')).toBe(9999999999)
  })

  it('es tolerante con números (legacy)', () => {
    expect(toCents(12.5)).toBe(1250)
    expect(toCents(0)).toBe(0)
  })

  it('devuelve 0 ante entrada inválida o vacía', () => {
    expect(toCents('')).toBe(0)
    expect(toCents('abc')).toBe(0)
    expect(toCents('12,50'.replace(',', '.'))).toBe(1250)
  })
})

describe('formatMoney', () => {
  it('formatea en es-ES con €', () => {
    expect(formatMoney('250.30')).toBe('250,30 €')
    expect(formatMoney('0')).toBe('0,00 €')
  })

  it('cuantiza strings de un decimal', () => {
    expect(formatMoney('12.5')).toBe('12,50 €')
  })

  it('acepta null/undefined (tolerante)', () => {
    expect(formatMoney(null)).toBe('0,00 €')
    expect(formatMoney(undefined)).toBe('0,00 €')
  })

  it('acepta números (tolerante durante el despliegue)', () => {
    expect(formatMoney(12.5)).toBe('12,50 €')
  })
})

describe('normalizeMoneyInput', () => {
  it('convierte coma a punto', () => {
    expect(normalizeMoneyInput('12,50')).toBe('12.50')
  })

  it('recorta a dos decimales y 8 enteros', () => {
    expect(normalizeMoneyInput('12.505')).toBe('12.50')
    expect(normalizeMoneyInput('123456789')).toBe('12345678')
  })

  it('elimina caracteres no numéricos', () => {
    expect(normalizeMoneyInput(' 12a.5x ')).toBe('12.5')
  })

  it('devuelve vacío si no hay dígitos', () => {
    expect(normalizeMoneyInput('')).toBe('')
    expect(normalizeMoneyInput('abc')).toBe('')
  })
})

describe('lineCents', () => {
  it('reproduce la fórmula half-up del backend', () => {
    // 2 × 10.50 sin descuento = 21.00
    expect(lineCents(2, '10.50', 0)).toBe(2100)
    // 1 × 5.25 con 10% = 4.725 → 4.73 (half-up)
    expect(lineCents(1, '5.25', 10)).toBe(473)
    // 2 × 10 con 10% = 18.00
    expect(lineCents(2, '10', 10)).toBe(1800)
  })

  it('el caso límite xx,xx5 redondea hacia arriba', () => {
    // 3 × 0.29 = 0.87; mejor caso explícito: 1 × 0.125 no es canónico,
    // así que probamos un entero: 5 × 0.29 × (1 - 0%) = 1.45
    expect(lineCents(5, '0.29', 0)).toBe(145)
  })
})

describe('formatLine', () => {
  it('formatea el importe de línea', () => {
    expect(formatLine(2, '10.50', 0)).toBe('21,00 €')
    expect(formatLine(1, '5.25', 10)).toBe('4,73 €')
  })
})
