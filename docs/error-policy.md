# Política de errores de la API — comportamiento en la SPA

> Copia sincronizada del contrato de errores (la fuente funcional es la API de `gestaller-api`). Este documento añade la columna de comportamiento de la SPA. Mantener la sección §1-§5 idéntica a `backend/docs/error-policy.md`.

## 1. Formato

Toda respuesta de error sigue este formato y la aplicación **se basa en los códigos y datos estructurados**, nunca en comparar textos de mensajes:

```json
{
  "error": {
    "code": "…",
    "message": "…",
    "fields": {}
  }
}
```

- `code` y `message` son **obligatorios**.
- `fields` es **opcional**; objeto `{campo: mensaje}` para errores asociados a campos concretos.
- Pueden aparecer claves adicionales dentro de `error` (actualmente solo `deleted_id` en conflictos de soft delete).

## 2. Códigos y comportamiento resultante

| Código | HTTP | Comportamiento en la SPA |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Con `fields` → errores junto a los campos del formulario (`useFormMutation`). Sin `fields` → toast de error. |
| `AUTHENTICATION_REQUIRED` | 401 | El interceptor de axios intenta un refresh (una vez, con cola concurrente) o cierra sesión y redirige a `/login`. |
| `FORBIDDEN` | 403 | Página `SinAcceso` (vía `RequirePermission`/`can()`); las queries de soporte con 403 se silencian para no emitir toasts espurios. |
| `NOT_FOUND` | 404 | Página `NotFound` en navegación; recurso inexistente en lista/detalle → toast global de la query. |
| `CONFLICT` | 409 | Con `deleted_id` → diálogo de restaurar. Sin `deleted_id` → toast. |
| `RATE_LIMITED` | 429 | Toast. |
| `INTERNAL_ERROR` | 500 | Toast con mensaje genérico (nunca stack trace ni detalle de infraestructura). |
| `NETWORK_ERROR` | — (sin respuesta HTTP) | Toast "No se ha podido conectar con el servidor…". Nunca se confunde con un 500. |

## 3. Normalización en el cliente

- `src/types/errors.ts` define `ApplicationError` (`{ code, message, fields?, status?, deleted_id? }`).
- `toApplicationError(err)` normaliza cualquier origen (axios HTTP, fallo de red, respuesta sin el formato esperado) al tipo canónico, con fallbacks por status (401/403/404/409/422/429/500).
- **Un fallo de query nunca se interpreta como lista vacía:** el `QueryCache.onError` global notifica todo error de listado/detalle con `emitToast` (salvo `FORBIDDEN`, gestionado por la UI).
- Las mutaciones no-GET emiten toast desde el interceptor de axios (excepto `VALIDATION_ERROR` con `fields` y `CONFLICT` con `deleted_id`, que gestiona el formulario).

## 4. Principios

- Los errores se detectan por `code` y campos estructurados, nunca por el texto de `message`.
- Ningún componente interpreta un `AxiosError` directamente: siempre pasa por `toApplicationError`.

---

Ver `backend/docs/error-policy.md` para la implementación canónica (reglas de seguridad, `AppError`, casos particulares y ejemplos).