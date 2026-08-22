# Gestaller Web (frontend)

SPA de gestión de lavaderos y talleres: clientes, vehículos, servicios, órdenes de trabajo, presupuestos, facturación, recambios e inventario, con usuarios/roles/permisos (RBAC), dashboard y reportes.

- **Stack**: React 18, Vite, TypeScript, Tailwind CSS 4, React Query, Zod.
- **Repo hermano**: `gestaller-api` (backend FastAPI). El contrato entre ambos es la API + `docs/error-policy.md`.

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

- El proxy de desarrollo apunta a `VITE_DEV_PROXY_TARGET` (por defecto `http://localhost:8000`; en Docker lo fija el compose a `http://api:8000`).
- Credenciales seed (las siembra el backend): **admin / admin123**.

## Arquitectura

- `src/pages/` — una página por módulo (17 + NotFound).
- `src/components/` — Modal, DataTable, ItemsForm, CategoryManager.
- `src/hooks/useAuth.tsx` — token en localStorage, refresh token en cookie httpOnly (`/api/auth`), catálogo de permisos y `catalogReady`.
- `src/services/api.ts` — axios con cola de refresh concurrente al 401 y toasts de error.
- `src/permissions.ts` — plantillas de roles (sin dependencias hardcodeadas).

## Convenciones (obligatorias)

- Errores de API según el contrato de `docs/error-policy.md` (código + mensaje + `fields`); el frontend nunca interpreta un fallo de query como lista vacía (`QueryCache.onError` global muestra toast).
- **Permisos**: se consumen vía `GET /api/permissions/catalog` (fuente única: `seed_data/permissions.json` del backend). Añadir un permiso no requiere cambios en TS.
- Código e identificadores en inglés; mensajes de usuario visibles en español.
- Las facturas no se eliminan: solo se anulan. Presupuesto convertido no mostrable como eliminable (`canDelete` por fila en DataTable).
- Los ítems de documentos exigen exactamente un servicio o producto ("+ Añadir servicio" / "+ Añadir producto").
- Edición siempre con los `PUT` del backend; acciones de negocio con `POST .../complete`, `.../convert`, `.../void`.

## Gotchas conocidos

- Sin tests de frontend todavía (`pnpm lint` es la única verificación estática).
- Búsqueda/filtrado server-side solo en Clientes.
- `tailwind.config.ts` no existe: Tailwind 4 se configura por CSS (`@import "tailwindcss"`).
