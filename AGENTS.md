# Gestaller Web (frontend)

SPA de gestión de lavaderos y talleres: clientes, vehículos, servicios, órdenes de trabajo, presupuestos, facturación, recambios y proveedores, con usuarios/roles/permisos (RBAC), dashboard y reportes.

- **Stack**: React 18, Vite, TypeScript, Tailwind CSS 4, React Query, Zod, axios, lucide-react.
- **Repo hermano**: `gestaller-api` (backend FastAPI). El contrato entre ambos es la API + [`docs/error-policy.md`](./docs/error-policy.md) (copia sincronizada del backend).

## Comandos

```bash
pnpm install
pnpm dev      # Servidor de desarrollo en :5173 (proxy /api → http://localhost:8000)
pnpm lint     # tsc --noEmit
pnpm build    # tsc && vite build
```

Con Docker (requiere el backend levantado; ambos composes comparten la red `gestaller-dev`):

```bash
docker compose -f docker-compose.dev.yml up --build
```

Producción (SPA compilada servida por Caddy en el VPS con `PUBLIC_HOST` obligatorio,
Let's Encrypt automático; reverse proxy `/api` → `api:8000`; red `gestaller-prod`;
publica :80 y :443). Orquestado por `../prod.sh`.

```bash
docker compose --env-file ../.env -f docker-compose.prod.yml up --build
```

- El proxy de desarrollo apunta a `VITE_DEV_PROXY_TARGET` (por defecto `http://localhost:8000`; en Docker lo fija el compose a `http://api:8000`).
- Credenciales seed (las siembra el backend): **admin / admin123**.

## Arquitectura

- `src/pages/` — 26 páginas importadas en `App.tsx`: una por módulo (incluye `Settings` en `/settings`, `TaxRates`, `PerfilTaller`, `HistoricoOrdenes`) + 4 de impresión (factura, presupuesto, resguardo, certificado) + Login, Dashboard y NotFound.
- `src/components/` — Modal, DataTable, ItemsForm, CategoryManager, ConfirmDialog, SearchSelect, RequirePermission/ProtectedRoute, Toast, Form, Checkbox, ErrorBoundary, CarSilhouette.
- `src/hooks/useAuth.tsx` — token en localStorage, refresh token en cookie httpOnly (`/api/auth`), catálogo de permisos y `catalogReady`.
- `src/hooks/usePaginatedQuery.ts` — listados paginados server-side (page + search con debounce; `queryKey` comparte prefijo con el modo `all` para que `invalidateQueries` invalide ambos).
- `src/services/api.ts` — axios con cola de refresh concurrente al 401 y toasts de error.
- `src/permissions.ts` — plantillas de roles (sin dependencias hardcodeadas).

## Convenciones (obligatorias)

- Errores de API según el contrato de `docs/error-policy.md` (código + mensaje + `fields`); el frontend nunca interpreta un fallo de query como lista vacía (`QueryCache.onError` global muestra toast).
- **Permisos**: se consumen vía `GET /api/permissions/catalog` (fuente única: `seed_data/permissions.json` del backend). Añadir un permiso no requiere cambios en TS.
- Código e identificadores en inglés; mensajes de usuario visibles en español.
- Las facturas no se eliminan ni se modifican tras emitirse (quedan invariables). Presupuesto convertido no mostrable como eliminable (`canDelete` por fila en DataTable).
- Los ítems de documentos exigen exactamente un servicio o producto ("+ Añadir servicio" / "+ Añadir producto").
- Edición siempre con los `PUT` del backend; acciones de negocio con `POST .../complete`, `.../convert`.
- **Paginación server-side**: todo listado devuelve `Paginated<T>` (`{items, total, page, page_size}`) vía `listX(params?: ListParams) → Promise<Paginated<T>>` (`ListParams` = `{page?, pageSize?, all?, search?}`; `pageParams()` traduce a snake_case). Las tablas usan `usePaginatedQuery` + `<DataTable pagination={...} />`. **Los dropdowns/selects y mapas usan `{ all: true }`** para traer el catálogo completo, nunca un listado paginado.
- `pagination.page_size` (parámetro del sistema editable en Ajustes `/settings`, permisos `settings.edit`) fija el tamaño de página por defecto; el footer de paginación de `DataTable` no expone selector de tamaño.

## Gotchas conocidos

- Sin tests de frontend todavía (`pnpm lint` es la única verificación estática).
- Búsqueda/filtrado server-side con el param `search` **solo en Clientes, Vehículos e Histórico de órdenes**; en el resto de listados el backend lo ignora (devuelven todo paginado por `page`/`page_size`).
- `tailwind.config.ts` no existe: Tailwind 4 se configura por CSS (`@import "tailwindcss"`).

## Responsive (3 tamaños)

Breakpoints propios definidos en `src/index.css` (`@theme`), mobile-first:

| Tamaño | Rango | Prefijo |
|---|---|---|
| Mobile | 0 – 767px | estilos base (sin prefijo) |
| Tablet | 768 – 1023px | `sm:` |
| Desktop | ≥ 1024px | `md:` (`lg:` reservado en 1536px) |

El layout (`src/components/Layout.tsx`) usa un único menú en todos los tamaños:

- Barra de marca superior (marca "Gestaller", usuario y "Cerrar sesión") siempre visible.
- Debajo, el **nav horizontal** agrupado por secciones (Taller, Comercial, Catálogo, Administración), con dropdowns por sección, siempre visible en cualquier tamaño.
- **Mobile (<768px)**: además, botón ☰ en la barra de marca que abre un drawer deslizante con el acordeón de navegación completo. En tablet/desktop el ☰ está oculto (`sm:hidden`).
