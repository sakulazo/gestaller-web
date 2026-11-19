import { describe, expect, it } from 'vitest'
import { tenantSchema, tenantUpdateSchema } from './validation'

describe('tenantSchema', () => {
  it('acepta un nombre y un slug válido', () => {
    expect(tenantSchema.safeParse({ name: 'Taller Norte', slug: 'taller-norte' }).success).toBe(true)
  })

  it('permite omitir el slug: el backend lo deriva del nombre', () => {
    expect(tenantSchema.safeParse({ name: 'Taller Norte' }).success).toBe(true)
    expect(tenantSchema.safeParse({ name: 'Taller Norte', slug: '' }).success).toBe(true)
  })

  it('rechaza slugs con mayúsculas o caracteres no permitidos', () => {
    expect(tenantSchema.safeParse({ name: 'Taller', slug: 'Taller-Norte' }).success).toBe(false)
    expect(tenantSchema.safeParse({ name: 'Taller', slug: 'taller_norte' }).success).toBe(false)
  })

  it('la edición no admite un slug vacío', () => {
    expect(tenantUpdateSchema.safeParse({ slug: '' }).success).toBe(false)
    expect(tenantUpdateSchema.safeParse({ name: 'Taller Norte' }).success).toBe(true)
  })
})
