# Gestaller — Frontend

SPA de la aplicación de gestión de lavaderos y talleres. Consume la API REST del backend (FastAPI) en su versión actual (`/api/clients`, `/api/work-orders`, `/api/quotes`, `/api/invoices`, `/api/products`, `/api/users`, `/api/roles`, ...) para clientes, vehículos, servicios, categorías, órdenes de trabajo, presupuestos, facturación, recambios, proveedores, usuarios, roles y reportes.

## Stack

- **React 18** — biblioteca de UI
- **Vite** — bundler y servidor de desarrollo
- **TypeScript** — tipado estático
- **Tailwind CSS** — estilos
- **pnpm** — gestor de paquetes
- **React Router** — enrutado
- **React Query** — gestión de estado del servidor (opcional/recomendado)

## Estructura del proyecto

```
frontend/
├── src/
│   ├── components/   # Componentes reutilizables
│   ├── pages/        # Páginas por módulo (login, clientes, ordenes, ...)
│   ├── services/     # Cliente HTTP y llamadas a la API
│   ├── hooks/        # Hooks personalizados
│   ├── types/        # Tipos TypeScript compartidos
│   ├── utils/        # Utilidades (formato, validación)
│   ├── App.tsx       # Configuración de rutas
│   ├── main.tsx      # Punto de entrada
│   └── ...
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docker-compose.dev.yml
├── docs/               # Contrato de errores de la API (error-policy.md)
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
# 1. Instalar dependencias
pnpm install

# 2. Configurar variables de entorno
cp .env.example .env
# VITE_API_URL=http://localhost:8000

# 3. Arrancar el servidor de desarrollo
pnpm dev
```

La aplicación queda disponible en `http://localhost:5173`.

## Variables de entorno

| Variable | Descripción | Ejemplo |
| --- | --- | --- |
| `VITE_API_URL` | URL base de la API del backend | `http://localhost:8000` |
| `VITE_DEV_PROXY_TARGET` | Destino del proxy `/api` en dev (solo Docker) | `http://api:8000` |

## Proxy de desarrollo

En desarrollo, Vite redirige las peticiones `/api/*` al backend mediante proxy, evitando problemas de CORS. El destino se configura con `VITE_DEV_PROXY_TARGET` (por defecto `http://localhost:8000`):

```ts
// vite.config.ts
const proxyTarget = process.env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'

server: {
  host: true,
  proxy: {
    '/api': {
      target: proxyTarget,
      changeOrigin: true,
    },
  },
},
```

## Scripts

```bash
pnpm dev       # Servidor de desarrollo con recarga en caliente
pnpm build     # Build de producción
pnpm preview   # Previsualizar el build
pnpm lint      # Lint de TypeScript/React
pnpm test      # Tests (si se configuran)
```

## Conexión con la API

- El cliente HTTP centraliza las llamadas a `VITE_API_URL` con prefijo `/api` (API v2, endpoints en inglés).
- El token JWT se obtiene en el login y se envía en el header `Authorization: Bearer <token>`.
- Ante respuestas `401`, el cliente redirige al login.
- El estado del servidor se gestiona con React Query (caché, refetch y mutaciones).
- Las operaciones de edición usan los `PUT` del backend; las acciones de negocio (`completar orden`, `convertir presupuesto`) usan los endpoints `POST .../complete` y `.../convert`.

## Rutas principales

| Ruta | Módulo |
| --- | --- |
| `/login` | Autenticación |
| `/` | Dashboard |
| `/clients` | Gestión de clientes |
| `/vehicles` | Gestión de vehículos |
| `/vehicle-categories` | Categorías de vehículo |
| `/services` | Catálogo de servicios |
| `/service-categories` | Categorías de servicio |
| `/work-orders` | Órdenes de trabajo |
| `/quotes` | Presupuestos |
| `/invoices` | Facturación |
| `/products` | Catálogo de productos |
| `/product-categories` | Categorías de producto |
| `/providers` | Proveedores |
| `/users` | Usuarios |
| `/roles` | Roles y permisos (RBAC) |
| `/reports` | Dashboard y reportes |

## Convenciones

- Componentes en `src/components`, páginas en `src/pages`.
- Tipos de dominio en `src/types` compartidos con la API.
- No se versionan secretos: solo `.env.example`.
