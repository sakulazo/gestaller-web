# SPECS — Gestaller Web (frontend)

> Especificaciones de comportamiento de la SPA. Describen lo que la aplicación hace hoy (implementación actual). Este documento es autocontenido: replica por copia el contrato de errores que la aplicación consume (fuente funcional de la verdad es la API) y no depende de ningún otro repositorio.

Stack: React 18, TypeScript, Vite, Tailwind CSS 4, React Query, Zod, axios.

---

## 1. Contrato de errores de la API

### 1.1 Formato

Toda respuesta de error de la API sigue este formato y la aplicación **se basa en los códigos y datos estructurados**, nunca en comparar textos de mensajes:

```json
{
  "error": {
    "code": "…",
    "message": "…",
    "fields": {}
  }
}
```

`code` y `message` son obligatorios; `fields` es opcional (errores asociados a campos). Puede aparecer `deleted_id` dentro de `error` en conflictos de soft delete.

### 1.2 Códigos y comportamiento resultante

| Código | HTTP | Comportamiento en la SPA |
|---|---|---|
| `VALIDATION_ERROR` | 422 | Con `fields` → errores junto a los campos. Sin `fields` → toast de error |
| `AUTHENTICATION_REQUIRED` | 401 | Refresh automático (una vez) o cierre de sesión + redirección a `/login` |
| `FORBIDDEN` | 403 | Página `SinAcceso` (vía `RequirePermission`) |
| `NOT_FOUND` | 404 | Página `NotFound` (catch-all de rutas); recurso inexistente en lista/detalle → toast global |
| `CONFLICT` | 409 | Con `deleted_id` → diálogo de restaurar. Sin `deleted_id` → toast |
| `RATE_LIMITED` | 429 | Toast |
| `INTERNAL_ERROR` | 500 | Toast con mensaje genérico (nunca stack trace ni detalle de infraestructura) |
| `NETWORK_ERROR` | — | Toast "No se ha podido conectar con el servidor…" |

### 1.3 Errores de red

Un fallo de conexión (sin respuesta HTTP) se tipa como `NETWORK_ERROR` y se muestra como toast de error. Nunca se confunde con un 500.

### 1.4 Principio global

**Un fallo de query nunca se interpreta como lista vacía.** Los errores de listado/detalle se notifican siempre (globals via QueryCache, ver §9).

---

## 2. Cliente HTTP y abstracción de error

### 2.1 Instancia

`src/services/api.ts` — instancia única de axios:

- `baseURL`: `VITE_API_URL` + `/api`, o `/api` (proxy de Vite en desarrollo).
- `withCredentials: true` (la cookie httpOnly del refresh token viaja sola).
- Interceptor de petición: añade `Authorization: Bearer <token>` desde `gestaller_token` (localStorage) cuando existe.

### 2.2 Tratamiento de respuestas (interceptor)

1. **401 sin `_retry`** → intenta refresh una vez:
   - Sin token en localStorage → limpia `gestaller_user` y redirige a `/login`.
   - Con refresh en curso → encola la petición y la re-ejecuta al terminar (cola de refresco concurrente).
   - Lanza `POST /auth/refresh` con axios "pelado" (sin re-disparar el interceptor); guarda el nuevo `access_token` y reintenta la petición original.
   - Si el refresh falla → limpia token/usuario y redirige a `/login`.
2. **`VALIDATION_ERROR` con `fields`** y **`CONFLICT` con `deleted_id`** → se rechaza la promesa sin toast (el formulario/UI se encarga).
3. **Resto de fallos en mutaciones (non-GET)** → toast de error con `message`.
4. Las **queries (GET)** no lanzan toast aquí: lo hace el `QueryCache.onError` global (§9).

### 2.3 `ApplicationError`

`src/types/errors.ts` — `{ code, message, fields?, status?, deleted_id? }`. `toApplicationError(err)` normaliza cualquier error (axios, red, respuestas sin el formato esperado) al tipo canónico, con fallbacks por status (401/403/404/409/422/429/500). Sin esta capa ningún componente interpreta `AxiosError` ni texto de mensaje.

---

## 3. Autenticación y sesión

- **Login** (`POST /api/auth/login`): guarda `access_token` en `gestaller_token`; pide `/api/auth/me` y guarda el usuario (con `roles` y `permissions`) en `gestaller_user` (JSON en localStorage).
- **Refresh**: viaja por cookie httpOnly; no se guarda en localStorage. Manejado automáticamente por el interceptor (§2.2).
- **Logout**: llama a `POST /api/auth/logout` y limpia `gestaller_token`/`gestaller_user` y el estado de contexto.
- **Sesión viva**: al recuperar el foco de la ventana se re-valida `/api/auth/me` y se actualiza el usuario en cache.
- **`useAuth()`** (contexto `src/hooks/useAuth.tsx`) expone: `user`, `token`, `login`, `logout`, `can(code)`, `catalog`, `catalogReady`, `getPermissionsForRoute(route)`, `getModules()`.
  - `can(code)` = `user.permissions.includes(code)`.
  - `catalogReady` pasa a `true` cuando el catálogo de permisos terminó de cargar **con datos o con error** (un fallo de catálogo se trata como sin-permisos; nunca como "cargando" indefinido).

---

## 4. Permisos (RBAC)

- **Origen**: catálogo consumido vía `GET /api/permissions/catalog` (la fuente de verdad del catálogo vive en el servidor). No hay catálogo hardcodeado en TS.
- `RequirePermission module="/x"`: resuelve los códigos de la ruta desde `catalog.route_permissions[route]`; muestra la página si el usuario tiene al menos uno de los códigos con sufijo `.view` (o el código que aplique), "Cargando…" hasta `catalogReady`, y en otro caso la página `SinAcceso`.
- `src/permissions.ts` — plantillas de roles para la UI de roles (`admin`, `readonly`, `mecanico`, `vendedor`). `resolveTemplateCodes` admite `'*'` (todos) y `'*.view'` (solo lectura). Las dependencias entre permisos se leen del catálogo (no se hardcodean aquí).

---

## 5. Formularios y validación

### 5.1 Reglas

- Todo formulario gestionado por la SPA usa `<form noValidate>`: el navegador no presenta mensajes de validación nativos.
- La validación **Zod** (`src/lib/validation.ts`) es solo para UX, antes de enviar; **la autoridad definitiva es la API**.
- Un campo inválido muestra su error **junto al campo**; un error general no asociado a un campo se muestra como **toast**.

### 5.2 `useFormMutation` (`src/hooks/useFormMutation.ts`)

Hook estándar de los formularios de la SPA. Flujo:

1. `resetErrors()`.
2. Validación Zod (`schema`): si falla, mapea los issues a `fieldErrors` (estructura `{campo: mensaje}`) y aborta sin llamar a la API.
3. Llamada a la API:
   - `CONFLICT` con `deleted_id` + `onConflict` → lanza el diálogo de restaurar.
   - Con `fields` → los copia a `fieldErrors` (error junto al campo).
   - Sin `fields` y no `VALIDATION_ERROR` → `generalError` + toast.
4. `onSuccess` → toast de éxito y cierre/refresh del formulario.

### 5.3 Componentes de formulario (`src/components/Form.tsx`)

- `FormField` / `FormInput` / `FormTextarea` / `FormSelect` con `FieldError`.
- Accesibilidad: `aria-invalid={!!error}`, `aria-describedby` apuntando al `id` del mensaje, `role="alert"` en el mensaje de error. El error nunca se comunica solo con color.

---

## 6. Toasts

`src/components/Toast.tsx` — **único** sistema de notificación (`ToastProvider` + `useToast()`), de uso dentro de React, y `emitToast(type, message)` para usarlo fuera (interceptor de axios, QueryCache).

- Tipos: `success`, `error`, `info` (5 s de duración; el usuario puede cerrarlas).
- Mensajes de éxito de las operaciones → toast de éxito.
- Los errores asociados a un campo **no** se muestran como toast (excepto cuando llegan sin `fields`, ver §5.2). No se duplica manualmente el `try/catch` para toasts: eso lo centraliza el interceptor y `useFormMutation`.

---

## 7. Flujo de estados de órdenes e ítems (UI)

El estado es **derivado y de solo lectura**: la SPA lo muestra tal como lo devuelve la API (`derived_status`), con etiqueta e insignia de color por estado. El usuario no elige estado: ejecuta **acciones** con su propio endpoint.

### 7.1 Orden de trabajo (`src/pages/Ordenes.tsx`)

Estados mostrados: `abierta`, `en_progreso`, `completada`, `entregada`, `cancelada`.

Matriz de acciones sobre una orden en seguimiento (visibles según estado y permiso):

| Acción | Visible cuando | Endpoint | Confirmación |
|---|---|---|---|
| Ingresar (check-in) | estado `abierta` | `POST /work-orders/{id}/check-in` | no |
| Entregar | estado `completada` o `cancelada` | `POST /work-orders/{id}/deliver` | no |
| Cancelar | estado `abierta` o `en_progreso` | `POST /work-orders/{id}/cancel` | sí (`ConfirmDialog`, los ítems no se tocan) |
| Reactivar | estado `cancelada` | `POST /work-orders/{id}/reactivate` | no |

- En la **creación** hay un checkbox "Ingresar vehículo al taller" (`Checkbox`); si se marca, tras crear la orden se llama a `check-in`.
- El formulario de edición queda **solo lectura** cuando el estado es `cancelada`/`entregada` (no se pueden modificar órdenes cerradas).
- Las líneas se gestionan desde la página propia (`/work-orders/:id/items`) o un modal embebido; "Tiempo" muestra `total` (minutos) suministrado por la API.
- **Histórico** (`/work-orders/history`): lista las órdenes entregadas con resumen de ejecución y un modal de detalle (cabecera + timestamps + líneas).

### 7.2 Ítems (`src/pages/OrdenItems.tsx`)

Estados mostrados: `pendiente`, `asignado`, `completado`, `cancelado`, `producto` (los productos no tienen ciclo de vida).

- Solo se pueden modificar líneas en órdenes `abierta`, `en_progreso` o `completada` (mismo guard que la API: en otro estado no aparecen botones y se muestra aviso).
- Acciones por línea (ítem de **servicio** en `pendiente`/`asignado`):
  - **Completar** → `POST /work-orders/{id}/items/{itemId}/complete`.
  - **Cancelar** → `POST /work-orders/{id}/items/{itemId}/cancel`.
- Alta/edición/borrado → `POST`/`PATCH`/`DELETE` sobre `/work-orders/{id}/items…` (cada cambio persiste al instante).
  - Dos vías de alta: "+ Añadir servicio" / "+ Añadir producto".
  - Al elegir la referencia desde el catálogo se auto-rellenan `description`, `unit_price` y, para servicios, `duration_minutes` (ajustables).
  - `assigned_to` solo se ofrece para servicios.
- Borrado de línea pasa por `ConfirmDialog` (avisa de que el tiempo total se recalcula).
- Permisos: `work_order_items.create/edit/delete/complete/cancel`.

---

## 8. Reglas de negocio en la UI

- **Facturas**: no hay borrado. Solo la acción "Anular" (visible si estado `emitida` y permiso `invoices.void`), con confirmación → `POST /invoices/{id}/void`. (El formulario de edición de una factura anulada permanece en pantalla; es coherente con el estado mostrado desde la API.)
- **Presupuestos**: un presupuesto `convertido` no muestra botón de eliminar (`canDelete` por fila en `DataTable`); sí la acción "Aprobar" y "Convertir" (→ crea factura) cuando aplica.
- **Soft delete (datos maestros)**: el borrado es lógico (marcar `deleted_at`). Al recibir `CONFLICT` con `deleted_id` (valor único ocupado por un registro borrado) se muestra un diálogo de restauración que llama a `POST /{recurso}/{id}/restore`.
- **Ítems de documentos**: exactamente un `service_id` o `product_id` (validación UI + validación autoritativa en la API).

---

## 9. React Query y listados

- `QueryClient` global con `QueryCache.onError`: **todo error de query** (red, 500, 403, …) emite un toast. Por eso un fallo nunca se presenta como lista vacía.
- Los listados renderizan `query.data ?? []`; el estado de carga se muestra explícitamente ("Cargando…").
- Tras una mutación, las queries afectadas se invalidan (p. ej. `['work-orders']`, `['work-order', id]`, `['work-order-items', id]`).
- Fetch por efecto/focus para `me` (renovación de datos de usuario), con fallo silencioso.

---

## 10. Accesibilidad

- Formularios con `<form noValidate>` (§5.1); campos con error con `aria-invalid` y `aria-describedby`; mensajes de error con `role="alert"`.
- Toasts con `role="alert"` y botón de cierre con `aria-label`.
- No se depende solo del color para comunicar errores o estados (las insignias de estado llevan texto).

---

## 11. Arquitectura y convenciones

- `src/pages/` — una página por módulo (+ `NotFound`, `SinAcceso`, `Datos` de desarrollo).
- `src/components/` — `DataTable` (con `onRowClick`, `canDelete` por fila), `Modal`, `ConfirmDialog`, `ItemsForm`, `CategoryManager`, `SearchSelect`, `Checkbox`, `Toast`, `Form`, `ui.ts` (estilos compartidos).
- `src/services/` — capa de servicios tipada por recurso; todas las rutas que consume existen en la API.
- Identificadores y nombres en inglés; mensajes visibles al usuario en español.
- Verificaciones estáticas: `pnpm lint` (`tsc --noEmit`) y `pnpm build` (`tsc && vite build`).