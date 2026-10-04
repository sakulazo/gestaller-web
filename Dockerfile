# Dockerfile de producción del frontend gestaller (React/Vite).
# Multi-stage: construye el bundle estático y lo exporta a / (raíz del stage final).
# El deploy usa 'docker build --output type=local' para volcar dist/ al directorio servido por Caddy.
FROM node:22-alpine AS build

# Flag de construcción, SIN valor por defecto. Lo pone el stack de la DEMO al
# construir sus estáticos (--build-arg VITE_DEMO_BANNER=1) y producción no lo
# pasa nunca, así que el banner de aviso de la demo no existe en su bundle. Es
# un ARG y no algo fijo en el código porque los dos stacks se construyen desde
# este mismo repositorio: lo único que los distingue en la construcción es este
# flag (ADR-0013).
ARG VITE_DEMO_BANNER=
ENV VITE_DEMO_BANNER=${VITE_DEMO_BANNER}

WORKDIR /app

# pnpm 11.18.0 (lockfile v9)
RUN npm install -g pnpm@11.18.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM scratch AS final
COPY --from=build /app/dist /