// Combobox con búsqueda: alternativa a <select> para listas largas.
// El valor seleccionado se expone con un <input type="hidden" name> para
// que los formularios existentes (basados en FormData) sigan funcionando.

import { useEffect, useMemo, useRef, useState } from 'react'
import { inputCls } from './ui'

export interface SearchSelectOption {
  value: string
  label: string
}

interface SearchSelectProps {
  name?: string
  options: SearchSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function SearchSelect({
  name,
  options,
  value,
  onChange,
  placeholder = 'Selecciona…',
  required,
  disabled,
}: SearchSelectProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value) ?? null

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    if (!q) return options
    return options.filter((o) => normalize(o.label).includes(q))
  }, [options, query])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const select = (option: SearchSelectOption) => {
    onChange(option.value)
    setQuery('')
    setOpen(false)
    inputRef.current?.blur()
  }

  const clear = () => {
    onChange('')
    setQuery('')
    setOpen(false)
    inputRef.current?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && filtered[highlight]) select(filtered[highlight])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        className={`${inputCls} w-full pr-8`}
        placeholder={selected ? '' : placeholder}
        value={query || (selected?.label ?? '')}
        onChange={(e) => {
          const text = e.target.value
          setQuery(text)
          setOpen(true)
          setHighlight(0)
          if (selected && text !== selected.label) onChange('')
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        required={required && !selected}
        autoComplete="off"
      />
      {selected && !disabled && (
        <button
          type="button"
          onClick={clear}
          title="Limpiar"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          ×
        </button>
      )}
      {open && !disabled && (
        <ul className="absolute z-20 mt-1 max-h-60 min-w-48 w-full overflow-auto rounded border border-slate-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">Sin resultados</li>
          ) : (
            filtered.map((option, i) => (
              <li key={option.value}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    select(option)
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-slate-100 ${
                    i === highlight ? 'bg-slate-100' : ''
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      <input type="hidden" name={name} value={value} />
    </div>
  )
}
