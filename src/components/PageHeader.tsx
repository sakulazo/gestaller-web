// Cabecera de página: barrita de acento + título (y opcionalmente subtítulo y
// acciones a la derecha). Unifica el patrón que estaba copiado en cada página.

import type { ReactNode } from 'react'

interface PageHeaderProps {
  /** Título de la página. Si se omite no se pinta el <h1> (modo embebido). */
  title?: ReactNode
  /** Línea de contexto bajo el título: texto, píldora de estado, etc. */
  subtitle?: ReactNode
  /** Acciones (botones) alineadas a la derecha de la cabecera. */
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  if (!title && !subtitle && !actions) return null
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      {(title || subtitle) && (
        <div className="min-w-0">
          {title && (
            <h1 className="flex items-center gap-3 text-page-title font-bold text-slate-900">
              <span aria-hidden className="h-6 w-1.5 shrink-0 rounded-full bg-emerald-600" />
              <span className="min-w-0">{title}</span>
            </h1>
          )}
          {subtitle && (
            /* Sin título no hay separación que hacer: el subtítulo es lo primero. */
            <p className={title ? 'mt-1 text-sm text-slate-500' : 'text-sm text-slate-500'}>
              {subtitle}
            </p>
          )}
        </div>
      )}
      {actions && (
        /* El hijo de `actions` (botón o fragmento) se expande a lo ancho y queda
           apilado en móvil; a partir de tablet (`sm:`) vuelve a la fila compacta. */
        <div className="flex w-full shrink-0 flex-col gap-2 [&>*]:w-full [&>*]:justify-center sm:w-auto sm:flex-row sm:items-center sm:[&>*]:w-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
