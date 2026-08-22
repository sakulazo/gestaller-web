// Tipos de error de aplicación — contrato centralizado entre API y UI.

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_REQUIRED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'

export interface ApplicationError {
  code: ErrorCode
  message: string
  fields?: Record<string, string>
  status?: number
  deleted_id?: number
}

/** Extrae un ApplicationError desde cualquier valor lanzado por Axios. */
export function toApplicationError(err: unknown): ApplicationError {
  const ax = err as {
    response?: {
      status?: number
      data?: { error?: { code?: string; message?: string; fields?: Record<string, string>; deleted_id?: number } }
    }
    code?: string
    message?: string
  }

  // Error de red (no se pudo contactar al servidor)
  if (ax.code === 'ERR_NETWORK' || !ax.response) {
    return {
      code: 'NETWORK_ERROR',
      message: 'No se ha podido conectar con el servidor. Comprueba tu conexion e intentalo de nuevo.',
      status: 0,
    }
  }

  const status = ax.response?.status
  const body = ax.response?.data?.error

  if (body?.code && body?.message) {
    return {
      code: body.code as ErrorCode,
      message: body.message,
      fields: body.fields,
      status,
      deleted_id: body.deleted_id,
    }
  }

  // Fallback para respuestas sin nuestro formato (ej. proxys, CDNs)
  const fallbackMessages: Record<number, string> = {
    401: 'Sesion no valida.',
    403: 'No tienes permisos para esta accion.',
    404: 'Recurso no encontrado.',
    409: 'Conflicto con un registro existente.',
    422: 'Hay errores en los datos enviados.',
    429: 'Demasiadas peticiones. Intentalo mas tarde.',
    500: 'No se ha podido completar la operacion.',
  }

  return {
    code: status === 401 ? 'AUTHENTICATION_REQUIRED'
      : status === 403 ? 'FORBIDDEN'
      : status === 404 ? 'NOT_FOUND'
      : status === 409 ? 'CONFLICT'
      : status === 422 ? 'VALIDATION_ERROR'
      : 'INTERNAL_ERROR',
    message: fallbackMessages[status ?? 0] ?? ax.message ?? 'Error inesperado.',
    status,
  }
}
