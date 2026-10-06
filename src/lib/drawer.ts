// Estado del drawer móvil de navegación.
//
// El panel no se desmonta al pedir el cierre: si lo hiciera, el unmount cancelaría
// la animación de salida y el drawer desaparecería de golpe. Por eso el cierre
// tiene fase propia ('closing') y el desmontaje real ocurre al terminar la
// animación, con la acción `animationend`.
//
// La lógica vive aquí, y no en el componente, porque es lo único que hay que
// cubrir con test: `animationend` no dice si ha terminado la animación de
// entrada o la de salida, y confundirlas hace que el drawer se cierre solo.

export type DrawerState = 'closed' | 'open' | 'closing'

export type DrawerAction = 'open' | 'close' | 'animationend'

export function drawerReducer(state: DrawerState, action: DrawerAction): DrawerState {
  switch (action) {
    case 'open':
      return 'open'
    case 'close':
      // Idempotente: pulsar el overlay o la X dos veces no reinicia la salida.
      return state === 'open' ? 'closing' : state
    case 'animationend':
      // Solo la salida desmonta. La entrada también termina en `animationend`,
      // así que sin esta guarda el drawer se cerraría 200 ms después de abrirse.
      return state === 'closing' ? 'closed' : state
  }
}