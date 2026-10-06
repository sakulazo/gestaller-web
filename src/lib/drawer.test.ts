import { describe, expect, it } from 'vitest'
import { drawerReducer, type DrawerAction, type DrawerState } from './drawer'

const run = (state: DrawerState, ...actions: DrawerAction[]) =>
  actions.reduce(drawerReducer, state)

describe('drawerReducer', () => {
  it('abre desde cerrado', () => {
    expect(drawerReducer('closed', 'open')).toBe('open')
  })

  it('no se cierra solo al terminar la animación de entrada', () => {
    // La apertura también es una animación CSS y también dispara
    // `animationend`. Es el bug que hacia desaparecer el drawer solo.
    expect(run('closed', 'open', 'animationend')).toBe('open')
  })

  it('al cerrar pasa por "closing" y luego se desmonta', () => {
    expect(run('open', 'close')).toBe('closing')
    expect(run('open', 'close', 'animationend')).toBe('closed')
  })

  it('cerrar dos veces no reinicia la animación de salida', () => {
    expect(run('open', 'close', 'close')).toBe('closing')
  })

  it('ignora un cierre tardío si ya se había desmontado', () => {
    expect(drawerReducer('closed', 'close')).toBe('closed')
  })

  it('reabre si se pulsa el botón mientras se cierra', () => {
    expect(run('open', 'close', 'open')).toBe('open')
    expect(run('open', 'close', 'open', 'animationend')).toBe('open')
  })

  it('no se desmonta mientras está abierto', () => {
    expect(run('open', 'animationend', 'animationend')).toBe('open')
  })
})