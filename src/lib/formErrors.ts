// Comprobaciones sobre los errores de campo que devuelve la API.

/**
 * ¿Alguna clave de `fields` corresponde a un campo del payload enviado?
 *
 * `useFormMutation` pinta los errores de campo junto al input que tiene el
 * mismo `name`. Si la API señala claves que el formulario no conoce (por
 * ejemplo, parámetros internos expuestos por error), no habrá ningún error
 * inline: en ese caso hay que avisar con un toast para que el fallo no pase
 * desapercibido.
 */
export function fieldsMatchPayload(
  fields: Record<string, string>,
  payload: unknown,
): boolean {
  if (typeof payload !== 'object' || payload === null) return false
  return Object.keys(fields).some((field) => field in payload)
}
