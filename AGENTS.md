# Gestaller Web (frontend)

SPA de gestión de lavaderos y talleres: clientes, vehículos, servicios, órdenes de trabajo, presupuestos, facturación, recambios y proveedores, con usuarios/roles/permisos (RBAC), dashboard y reportes.

- **Stack**: React 18, Vite, TypeScript, Tailwind CSS 4, React Query, Zod, axios, lucide-react.
- **Repo hermano**: `gestaller-api` (backend FastAPI). El contrato entre ambos es la API + [`docs/error-policy.md`](./docs/error-policy.md) (copia sincronizada del backend).
- **Deploy**: [`docs/DEPLOY.md`](./docs/DEPLOY.md) — el runtime vive en `sakulazo/infra-vps`, no aquí.

## Comandos

```bash
pnpm install
pnpm dev      # Regenera la marca y levanta el servidor de desarrollo en :5173 (proxy /api → http://localhost:8000)
pnpm lint     # tsc --noEmit
pnpm test     # vitest run
pnpm build    # Regenera la marca, tsc && vite build
pnpm brand    # Regenera solo los assets de marca (ver "Marca")
```

Con Docker (requiere el backend levantado; ambos composes comparten la red `gestaller-dev`):

```bash
docker compose -f docker-compose.dev.yml up --build
```

**Producción: este repo no tiene despliegue propio** (ni compose, ni
`Dockerfile.prod`, ni `Caddyfile`). El `Dockerfile` de la raíz compila con Vite y
**exporta** `dist/` (`FROM scratch` + `--output type=local`) a
`/srv/gestaller/public` en el VPS; lo publica un timer de infra y lo sirve el
`caddy` global, que enruta `/api/*` al contenedor `gestaller-api-1` por el
nombre. Todo eso está en `sakulazo/infra-vps` y está descrito en
[`docs/DEPLOY.md`](./docs/DEPLOY.md).

Si alguien pide un compose de producción **aquí**, la respuesta es que va en
infra-vps: uno que publique `:80`/`:443` choca con el `caddy` del host y otro
que levante su propio servicio `api` no lo alcanza nadie. No reintroducir
`docker-compose.prod.yml`, `Dockerfile.prod` ni `Caddyfile` sin revisar
`docs/DEPLOY.md`.

- El proxy de desarrollo apunta a `VITE_DEV_PROXY_TARGET` (por defecto `http://localhost:8000`; en Docker lo fija el compose a `http://api:8000`).
- Credenciales seed (las siembra el backend): **admin / admin123**.

## Arquitectura

- `src/pages/` — 26 páginas importadas en `App.tsx`: una por módulo (incluye `Settings` en `/settings`, `TaxRates`, `PerfilTaller`, `HistoricoOrdenes`) + 4 de impresión (factura, presupuesto, resguardo, certificado) + Login, Dashboard y NotFound.
- `src/components/` — Modal, DataTable, ItemsForm, CategoryManager, ConfirmDialog, SearchSelect, RequirePermission/ProtectedRoute, Toast, Form, Checkbox, ErrorBoundary, Brand, CarSilhouette.
- `src/hooks/useAuth.tsx` — token en localStorage, refresh token en cookie httpOnly (`/api/auth`), catálogo de permisos y `catalogReady`.
- `src/hooks/usePaginatedQuery.ts` — listados paginados server-side (page + search con debounce; `queryKey` comparte prefijo con el modo `all` para que `invalidateQueries` invalide ambos).
- `src/services/api.ts` — axios con cola de refresh concurrente al 401 y toasts de error.
- `src/permissions.ts` — plantillas de roles (sin dependencias hardcodeadas).

## Marca (logo)

- **Fuente de verdad: `src/assets/brand/logo.svg`** (maestro editable, con el cromo de Inkscape). Contiene **solo el símbolo**: el wordmark "Gestaller" se pinta con HTML en `Brand.tsx` y no debe volver a dibujarse dentro del SVG. No existe copia fuera del repo.
- `scripts/brand.mjs` lo limpia (cabecera XML, comentarios, `defs`, `id`, `style` → atributos de presentación) y genera tres derivados, que **no se editan a mano**:
  - `src/assets/brand/logo-on-dark.svg` — fondo oscuro (barra del layout, drawer, login).
  - `src/assets/brand/logo-on-light.svg` — fondo claro: sustituye `#ffffff` → `#cbd5e1` y `#8e8e8e` → `#475569`.
  - `public/favicon.svg` — copia de `logo-on-light.svg`.
- Se ejecuta solo (en `pnpm dev` y `pnpm build`) o a mano con `pnpm brand`; los derivados se versionan para que `pnpm lint` y la revisión de diffs no dependan de generarlos. `node scripts/brand.mjs --check` falla si están caducados.
- En desarrollo con Docker, `../dev.sh` ejecuta `pnpm brand` **en el host** antes de levantar el contenedor: si solo generase el contenedor (root sobre el bind mount), los derivados quedarían propiedad de root en el disco. Si se edita el maestro con el stack ya levantado hay que reiniciar el contenedor de la app para que se apliquen los cambios.
- `src/components/Brand.tsx` solo consume las variantes por URL (Vite las hashea en el build); el wordmark "Gestaller" se pinta con texto y hereda tamaño/color del contenedor.

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

- Tests: hay `vitest` (`pnpm test`) pero la cobertura es **mínima**: solo `src/lib/demoReset.ts` (la cuenta atrás de la demo) y la lógica pura equivalente. Un módulo sin test sigue siendo el normal, no la excepción; si tocas lógica de cálculo (fechas, importes, agregados), añade el test en el mismo commit que el arreglo. Coherente con la regla de infra-vps de que un check nuevo tiene que tener un caso que lo haga fallar.
- La cuenta atrás de la demo (`src/lib/demoReset.ts`) calcula en la **zona del servidor**, no en la del navegador, y su objetivo es el minuto 5 de cada hora impar. Dos cosas que costan sangre y ya estan cubiertas por `src/lib/demoReset.test.ts`:
  - El offset de la zona se construye con los **mismos** campos que se leen del reloj (incluidos segundos y milisegundos). Truncar uno de los dos términos hace que el objetivo se desplace con el reloj en cada tick y el contador se quede clavado.
  - La recarga al reset se dispara por **cambio de objetivo**, nunca por `diff <= 0`: la función devuelve siempre un instante futuro, así que `diff` salta de ~0 a 2 h sin pasar por cero.
  - En el cambio de hora de **octubre** la hora 02:00 ocurre dos veces, y de las 01:06 a las 03:05 hay 119 min de reloj pero **179 reales**. El contador dice casi 3 h y es correcto: el timer sí dispara a las 03:05.
- Búsqueda/filtrado server-side con el param `search` **solo en Clientes, Vehículos e Histórico de órdenes**; en el resto de listados el backend lo ignora (devuelven todo paginado por `page`/`page_size`).
- `tailwind.config.ts` no existe: Tailwind 4 se configura por CSS (`@import "tailwindcss"`).
- `src/services/api.ts` espera **JSON** en `/api/*`. Si alguna vez una ruta de
  la API responde `text/html`, el síntoma no es un 404: es el `index.html` de la
  SPA llegando al cliente (fallback de Caddy mal acotado). Se comprueba con
  `make contract` en infra-vps.

## Responsive (3 tamaños)

Breakpoints propios definidos en `src/index.css` (`@theme`), mobile-first:

| Tamaño | Rango | Prefijo |
|---|---|---|
| Mobile | 0 – 767px | estilos base (sin prefijo) |
| Tablet | 768 – 1023px | `sm:` |
| Desktop | ≥ 1024px | `md:` (`lg:` reservado en 1536px) |

El layout (`src/components/Layout.tsx`) usa un único menú en todos los tamaños:

- Barra de marca superior (`<Brand variant="on-dark">`, usuario y "Cerrar sesión") siempre visible.
- Debajo, el **nav horizontal** agrupado por secciones (Taller, Comercial, Catálogo, Administración), con dropdowns por sección, siempre visible en cualquier tamaño.
- **Mobile (<768px)**: además, botón ☰ en la barra de marca que abre un drawer deslizante con el acordeón de navegación completo. En tablet/desktop el ☰ está oculto (`sm:hidden`).
