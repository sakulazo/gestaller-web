# Gestaller — Frontend

SPA de la aplicación de gestión de lavaderos y talleres. Consume la API REST del backend (FastAPI): clientes, vehículos (con categorías), servicios, órdenes de trabajo, presupuestos, facturación, recambios, proveedores, usuarios/roles (RBAC), tasas de IVA, parámetros del sistema, perfil de taller y reportes.

## Stack

- **React 18** — biblioteca de UI
- **Vite** — bundler y servidor de desarrollo
- **TypeScript** — tipado estático
- **Tailwind CSS 4** — estilos (configuración por CSS, sin `tailwind.config.ts`)
- **pnpm** — gestor de paquetes
- **React Router** — enrutado (v6)
- **React Query** — estado del servidor (caché, refetch, `QueryCache.onError` global)
- **Zod** — validación de formularios (UX)
- **axios** — cliente HTTP con cola de refresh concurrente
- **lucide-react** — iconos

## Estructura del proyecto

```
frontend/
├── src/
│   ├── components/   # Componentes reutilizables (Modal, DataTable, ItemsForm, …)
│   ├── pages/        # Páginas por módulo (incluye las de impresión: factura, presupuesto, resguardo, certificado)
│   ├── services/     # Cliente HTTP (api.ts) y funciones por recurso (index.ts)
│   ├── hooks/        # useAuth, usePaginatedQuery, useFormMutation, useMediaQuery
│   ├── types/        # Tipos TypeScript compartidos con la API (incl. errors.ts)
│   ├── permissions.ts# Plantillas de roles para la UI de roles
│   ├── App.tsx       # Configuración de rutas y QueryClient
│   ├── main.tsx      # Punto de entrada
│   └── index.css     # Tailwind 4 (@theme) y tokens
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docker-compose.dev.yml
├── docs/
│   ├── SPECS.md           # Especificaciones de comportamiento de la SPA
│   └── error-policy.md    # Contrato de errores (copia sincronizada del backend + comportamiento SPA)
├── .env.example
└── ...
```

## Requisitos previos

- Node.js 20+
- [pnpm](https://pnpm.io/installation)

## Puesta en marcha

### Opción A — Frontend en Docker

```bash
docker compose -f docker-compose.dev.yml up --build
```

Levanta el contenedor `app` con Vite y hot-reload. Requiere el backend (repo `gestaller-api`) levantado: ambos composes comparten la red Docker `gestaller-dev` y el proxy de Vite resuelve la API por su nombre de servicio (`http://api:8000` mediante `VITE_DEV_PROXY_TARGET`). El código se monta por volumen (con `node_modules` preservado en un volumen anónimo).

### Opción B — Procesos locales

```bash
pnpm install
pnpm dev
```

La aplicación queda disponible en `http://localhost:5173`, con `/api/*` haciendo proxy a `http://localhost:8000` (sin problemas de CORS).

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | BaseURL del cliente HTTP (vacío ⇒ usa `VITE_API_URL` + `/api`, o el proxy de Vite en dev) | `http://localhost:8000` |
| `VITE_DEV_PROXY_TARGET` | Destino del proxy `/api` en dev (solo Docker) | `http://api:8000` |

## Scripts

```bash
pnpm dev       # Servidor de desarrollo con recarga en caliente
pnpm lint      # tsc --noEmit (verificación estática)
pnpm build     # tsc && vite build
pnpm preview   # Previsualizar el build de producción
```

> No hay suite de tests: `pnpm lint` es la única verificación estática (pendiente añadir vitest/playwright).

## Conexión con la API

- Cliente HTTP único (`src/services/api.ts`): inyecta `Authorization: Bearer <token>`, `withCredentials: true` (cookie httpOnly del refresh).
- Ante un 401, el interceptor intenta **un refresh** (cola concurrente para no duplicar peticiones) y reintenta; si falla, cierra sesión y redirige a `/login`.
- Los errores se normalizan vía `toApplicationError` (`src/types/errors.ts`) y se gestionan por `code`, nunca por texto. Ver [Política de errores](./docs/error-policy.md).
- `QueryCache.onError` global: todo fallo de query muestra toast (un fallo nunca parece una lista vacía).
- Listados paginados server-side con envelope `Paginated<T>` (`{items, total, page, page_size}`) vía `listX(params?)` + hook `usePaginatedQuery`; los selects/dropdowns usan `{ all: true }`.
- Acciones de negocio con los endpoints `POST` del backend (check-in, entregar, cancelar, reactivar, archivar, completar ítem, convertir presupuesto).

## Rutas principales

| Ruta | Módulo |
| --- | --- |
| `/login` | Autenticación |
| `/` | Dashboard |
| `/clients`, `/vehicles`, `/vehicle-categories` | Clientes y vehículos |
| `/services`, `/service-categories` | Catálogo de servicios |
| `/work-orders` | Órdenes de trabajo |
| `/work-orders/history` | Histórico de órdenes (búsqueda por matrícula/cliente) |
| `/work-orders/:id/items` | Líneas de una orden |
| `/quotes` | Presupuestos |
| `/invoices` | Facturación |
| `/products`, `/product-categories`, `/providers` | Recambios |
| `/users`, `/roles` | Usuarios y roles (RBAC) |
| `/reports` | Reportes (facturación y actividad) |
| `/company-profile` | Perfil de taller |
| `/tax-rates` | Tasas de IVA |
| `/settings` | Parámetros del sistema |
| `/work-orders/:id/check-in` | Resguardo de deposito (impresión A5) |
| `/work-orders/:id/certificate` | Certificado de estancia del vehículo |
| `/invoices/:id/print`, `/quotes/:id/print` | Impresión A4 de factura y presupuesto |

Las URLs antiguas en español (`/clientes`, `/ordenes`, …) redirigen a sus equivalentes en inglés.

## Responsive

Layout mobile-first con header superior y nav horizontal por secciones (Taller, Comercial, Catálogo, Administración). En móvil (<768px) el nav es un drawer ☰ con acordeón; las tablas de ítems pasan a cards. Breakpoints propios en `src/index.css` (`@theme`): base (0–767px), `sm:` (≥768px), `md:` (≥1024px).

## Convenciones

- Componentes en `src/components`, páginas en `src/pages`.
- Tipos de dominio en `src/types` compartidos con la API.
- Validación UI con Zod; la autoridad es la API.
- Identificadores y nombres en inglés; mensajes visibles al usuario en español.
- No se versionan secretos: solo `.env.example`.
- Errores de API según [Política de errores](./docs/error-policy.md).