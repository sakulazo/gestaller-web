# Dockerfile de producción del frontend gestaller (React/Vite).
# Multi-stage: construye el bundle estático y lo exporta a / (raíz del stage final).
# El deploy usa 'docker build --output type=local' para volcar dist/ al directorio servido por Caddy.
FROM node:22-alpine AS build

WORKDIR /app

# pnpm 11.18.0 (lockfile v9)
RUN npm install -g pnpm@11.18.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

FROM scratch AS final
COPY --from=build /app/dist /