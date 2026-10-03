// Generador de assets de marca.
//
// Fuente de verdad: `src/assets/brand/logo.svg` (maestro editable, tal cual
// sale de Inkscape). Este script limpia el cromo del maestro y deriva los
// ficheros que consume la aplicación:
//
//   - src/assets/brand/logo-on-dark.svg   -> fondo oscuro (barra del layout)
//   - src/assets/brand/logo-on-light.svg  -> fondo claro (tarjeta de login)
//   - public/favicon.svg                  -> icono del navegador
//
// Se ejecuta automáticamente en `pnpm dev` y `pnpm build`, y se puede lanzar
// a mano con `pnpm brand` tras cada edición del maestro. Los ficheros
// generados se versionan: `--check` falla si están caducados.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const masterPath = join(root, 'src/assets/brand/logo.svg')

// Sustituciones de color por variante. El maestro tiene 14 rellenos `#ffffff`
// que desaparecen sobre la tarjeta blanca del login, y un trazo gris medio que
// allí pierde contraste.
const PALETTES = {
  'on-dark': {},
  'on-light': { '#ffffff': '#cbd5e1', '#8e8e8e': '#475569' },
}

// Propiedades de `style` que se traducen a atributos de presentación. El resto
// son valores identidad (`fill-opacity:1`, `stroke-dasharray:none`, ...) que se
// descartan. `fill-rule` se conserva: algunas trazados dependen de `evenodd`
// para sus agujeros interiores.
const KEEP_PROPS = ['fill', 'fill-rule', 'stroke', 'stroke-width', 'stroke-linejoin']

const BANNER =
  '<!-- GENERADO por scripts/brand.mjs: no editar a mano. Edita src/assets/brand/logo.svg y ejecuta `pnpm brand`. -->'

function clean(source) {
  let out = source

  out = out.replace(/<\?xml[\s\S]*?\?>/g, '')
  out = out.replace(/<!--[\s\S]*?-->/g, '')
  out = out.replace(/<defs\b[^>]*\/>/g, '')
  out = out.replace(/\s+id="[^"]*"/g, '')
  out = out.replace(/\s+version="[^"]*"/g, '')
  out = out.replace(/\s+xmlns:svg="[^"]*"/g, '')
  out = out.replace(/style="([^"]*)"/g, (_, style) => {
    const props = new Map()
    for (const decl of style.split(';')) {
      const idx = decl.indexOf(':')
      if (idx === -1) continue
      props.set(decl.slice(0, idx).trim(), decl.slice(idx + 1).trim())
    }
    const attrs = KEEP_PROPS.filter((p) => props.has(p))
      .map((p) => ` ${p}="${props.get(p)}"`)
      .join('')
    return attrs
  })

  // Un elemento por línea: el fichero se versiona y se revisa en diffs.
  out = out.replace(/\s+/g, ' ').replace(/>\s*</g, '>\n<').trim()
  return `${BANNER}\n${out}\n`
}

function applyPalette(svg, replacements) {
  let out = svg
  for (const [from, to] of Object.entries(replacements)) {
    out = out.replaceAll(new RegExp(from, 'gi'), to)
  }
  return out
}

// El regex de limpieza no debe perder ni añadir elementos: si el recuento
// difiere, algo se ha roto y es preferible fallar aquí.
function countElements(source) {
  const open = [...source.matchAll(/<(path|rect|circle|ellipse|polygon|polyline|line)\b/g)]
  const groups = [...source.matchAll(/<g\b/g)]
  return open.length + groups.length
}

const master = readFileSync(masterPath, 'utf8')
const cleaned = clean(master)
const expected = countElements(master)

const targets = {
  'logo-on-dark.svg': applyPalette(cleaned, PALETTES['on-dark']),
  'logo-on-light.svg': applyPalette(cleaned, PALETTES['on-light']),
}

const check = process.argv.includes('--check')
const changed = []

function emit(path, content) {
  const current = (() => {
    try {
      return readFileSync(path, 'utf8')
    } catch {
      return null
    }
  })()
  if (current === content) return
  changed.push(path)
  if (check) return
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content)
}

for (const [name, content] of Object.entries(targets)) {
  const found = countElements(content)
  if (found !== expected) {
    console.error(`brand: ${name} tiene ${found} elementos y el maestro ${expected}`)
    process.exit(1)
  }
  emit(join(root, 'src/assets/brand', name), content)
}

emit(join(root, 'public/favicon.svg'), targets['logo-on-light.svg'])

if (check && changed.length > 0) {
  console.error('brand: derivados caducados, ejecuta `pnpm brand`:')
  for (const path of changed) console.error(`  - ${path.slice(root.length + 1)}`)
  process.exit(1)
}

if (!check) {
  const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} KB`
  console.log(
    `brand: maestro ${kb(master)} -> ${Object.entries(targets)
      .map(([name, content]) => `${name} ${kb(content)}`)
      .join(', ')}, favicon.svg ${kb(targets['logo-on-light.svg'])}`,
  )
}