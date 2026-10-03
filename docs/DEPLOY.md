# Despliegue del frontend

> **Este repo no se despliega a sí mismo.** No hay compose ni Dockerfile de
> producción aquí, y no debe añadirse ninguno sin revisar antes el runtime real
> (ver más abajo). Si necesitas tocar el despliegue, el repo que lo gobierna es
> `sakulazo/infra-vps`.

## Qué corre en el VPS

En `gestaller.sakulazo.com` hay **tres** contenedores y ninguno es de este repo:

| Contenedor | Qué es | Dónde se define |
|---|---|---|
| `caddy` | TLS, `/api/*` → `gestaller-api-1:8000`, y la SPA estática | `stacks/caddy/Caddyfile` (infra-vps) |
| `gestaller-db-1` | PostgreSQL 16 | `stacks/gestaller/compose.yml` (infra-vps) |
| `gestaller-api-1` | API FastAPI | `stacks/gestaller/compose.yml` (infra-vps) |

**La SPA no está en un contenedor.** Este repo produce un `dist/` estático que
el VPS publica como ficheros en `/srv/gestaller/public`, servidos por el
`caddy` global. El `caddy` no hace `docker build` ni tiene volumen sobre el
código: solo lee ese directorio.

## El flujo real

Un timer del infra (`deploy-gestaller.timer`, cada 5 min) ejecuta
`deploy-gestaller.sh`, que por cada repo hace `git pull`, rebuild y
publicación. Para este repo, en síntesis:

```bash
docker build --output type=local,dest="$TMP_DIR" "$WEB_DIR"
find "$PUBLIC_DIR" -mindepth 1 -delete        # rotación: los hashes de Vite se acumulan
cp -a "$TMP_DIR"/. "$PUBLIC_DIR"/
```

(Esquema de `scripts/deploy-gestaller.sh` de infra-vps. No es un comando para
copiar a mano.)

El `Dockerfile` de la raíz es un multi-stage que compila con Vite y **exporta**
`dist/` con `FROM scratch` + `--output type=local`. No hay `CMD` ni servidor:
solo genera ficheros. Por eso el `Dockerfile` de la raíz es el único que
existe, y por eso se llama así y no `Dockerfile.prod`.

El build tira de `pnpm-lock.yaml` con `--frozen-lockfile`. En el VPS el checkout
no tiene `.env` (está gitignorado), así que `VITE_API_URL` llega vacía al build
y el cliente cae al `baseURL` relativo `/api` (`src/services/api.ts`): es el
Caddyfile del host quien reparte entre la SPA y la API, no el navegador. Si
alguna vez existiera un `.env` en ese checkout, la SPA apuntaría a lo que
diga ahí y dejaría de hablar con su propia API.

## Por qué este repo no lleva `docker-compose.prod.yml`

Porque el que había describía **otra** topología, que nunca estuvo desplegada, y
que si se ejecutase **rompería** producción:

- Publicaba `80:80` y `443:443` en el host. El `caddy` global ya los tiene:
  dos contenedores con los mismos puertos no arrancan.
- Emitía su propio certificado de Let's Encrypt para el mismo dominio que
  `caddy`, compitiendo por el reto HTTP-01.
- Levantaba su propio servicio `api` en la red `gestaller-prod`, mientras la
  API real corre como `gestaller-api-1` en `gestaller_gestaller_net`. El
  Caddyfile del host apunta al nombre real, así que el servicio del compose
  no era ni usado ni alcanzable.

Lo mismo pasaba con `Dockerfile.prod` (imagen `caddy:2-alpine`, es decir, **un
segundo Caddy**) y con `Caddyfile` (una segunda fuente de verdad para el
routing, con un arrangement *distinto* del que está en el host). Se han
eliminado los tres el 2026-10-03.

## Fallback de la SPA: la trampa de `/api`

Cualquier ruta de cliente que no exista como fichero debe devolver
`index.html` (p. ej. `/clients`, `/work-orders/42/items` al abrirse en cold).
Eso lo hace `try_files`, **pero nunca sobre `/api/*`**: si el fallback alcanza
`/api/permissions/catalog`, la API responde `200 text/html` con el `index.html`
de la SPA y el frontend recibe HTML donde espera JSON. El sitio "funciona" y
la API "funciona"; lo que falla es axios.

En el Caddyfile del host esto está resuelto con dos `handle` separados: uno
para `/api/*` (reverse proxy) y otro para el resto (`try_files` +
`file_server`). **No lo unifiques.** El canario que lo vigila es
`contract-check.sh` en infra-vps (`make contract`), que mira el *content type*
y no solo el código HTTP.

## Si necesitas revisar el build

- Verificación estática: `pnpm lint`.
- El build es lo que ejecuta producción, así que `pnpm build` es la prueba de
  fuego de los cambios en `src/` o en la marca.
- Los derivados de marca se versionan; `node scripts/brand.mjs --check` falla
  si están caducados.