// Marca de la aplicación: símbolo + wordmark "Gestaller".
//
// El SVG no está en este componente: la fuente de verdad es el maestro
// `src/assets/brand/logo.svg` y las dos variantes las genera
// `scripts/brand.mjs` (`pnpm brand`, también en `dev` y `build`).

import logoOnDark from '../assets/brand/logo-on-dark.svg'
import logoOnLight from '../assets/brand/logo-on-light.svg'

interface BrandProps {
  /** `on-dark` para fondos oscuros (barra de la app); `on-light` para claros. */
  variant?: 'on-dark' | 'on-light'
  /** Añade el texto "Gestaller", heredando tamaño y color del contenedor. */
  withWordmark?: boolean
  className?: string
  /** Altura del símbolo (`h-7`, `h-8`...). El ancho mantiene el aspecto. */
  symbolClassName?: string
}

export default function Brand({
  variant = 'on-dark',
  withWordmark = true,
  className = '',
  symbolClassName = 'h-8',
}: BrandProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={variant === 'on-light' ? logoOnLight : logoOnDark}
        alt={withWordmark ? '' : 'Gestaller'}
        className={symbolClassName}
      />
      {withWordmark && <span className="font-bold">Gestaller</span>}
    </span>
  )
}