// Tests de `fieldsMatchPayload`.

import { describe, expect, it } from 'vitest'
import { fieldsMatchPayload } from './formErrors'

describe('fieldsMatchPayload', () => {
  it('detecta un campo que existe en el payload', () => {
    expect(
      fieldsMatchPayload({ tax_id: 'El NIF ya está registrado' }, { tax_id: '123' }),
    ).toBe(true)
  })

  it('basta con que coincida una clave', () => {
    expect(
      fieldsMatchPayload({ db: 'Field required' }, { name: 'Cliente', db: 'x' }),
    ).toBe(true)
  })

  it('rechaza claves internas que el formulario no envía', () => {
    expect(
      fieldsMatchPayload(
        { db: 'Field required', data_dict: 'Field required' },
        { name: 'Cliente', tax_id: '123' },
      ),
    ).toBe(false)
  })

  it('devuelve false si el payload no es un objeto', () => {
    expect(fieldsMatchPayload({ name: 'obligatorio' }, null)).toBe(false)
    expect(fieldsMatchPayload({ name: 'obligatorio' }, undefined)).toBe(false)
    expect(fieldsMatchPayload({ name: 'obligatorio' }, 'texto')).toBe(false)
  })
})
