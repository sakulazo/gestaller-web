// Componentes de formulario reutilizables con soporte de errores.

import { useState, type ReactNode } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputCls, labelCls } from './ui'

// ---------- FieldError ----------

interface FieldErrorProps {
  id?: string
  message?: string
}

export function FieldError({ id, message }: FieldErrorProps) {
  return (
    <p
      id={id}
      role="alert"
      className={`mt-1 text-xs ${message ? 'text-red-600' : 'invisible'}`}
    >
      {message || '\u00A0'}
    </p>
  )
}

// ---------- FormField ----------

interface FormFieldProps {
  name: string
  label: string
  error?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function FormField({
  name,
  label,
  error,
  required,
  children,
  className = '',
}: FormFieldProps) {
  const errorId = `${name}-error`
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className={labelCls}>
          {label}
          {required && ' *'}
        </label>
      )}
      {children}
      <FieldError id={errorId} message={error} />
    </div>
  )
}

// ---------- FormInput ----------

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label: string
  error?: string
}

export function FormInput({ name, label, error, required, className, ...rest }: FormInputProps) {
  const errorId = `${name}-error`
  return (
    <FormField name={name} label={label} error={error} required={required}>
      <input
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${inputCls} w-full ${className ?? ''}`}
        {...rest}
      />
    </FormField>
  )
}

// ---------- FormPassword ----------

/** Igual que `FormInput`, pero con el botón del ojo para revelar el texto. `type`
 *  lo controla el propio componente, por eso se omite de las props admitidas. */
interface FormPasswordProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  name: string
  label: string
  error?: string
}

export function FormPassword({ name, label, error, required, className, ...rest }: FormPasswordProps) {
  const errorId = `${name}-error`
  const [visible, setVisible] = useState(false)
  return (
    <FormField name={name} label={label} error={error} required={required}>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? 'text' : 'password'}
          required={required}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          className={`${inputCls} w-full pr-10 ${className ?? ''}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-slate-400 hover:text-slate-600"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </FormField>
  )
}

// ---------- FormTextarea ----------

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string
  label: string
  error?: string
}

export function FormTextarea({ name, label, error, required, className, ...rest }: FormTextareaProps) {
  const errorId = `${name}-error`
  return (
    <FormField name={name} label={label} error={error} required={required}>
      <textarea
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${inputCls} w-full resize-y ${className ?? ''}`}
        {...rest}
      />
    </FormField>
  )
}

// ---------- FormSelect ----------

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string
  label: string
  error?: string
  children: ReactNode
}

export function FormSelect({ name, label, error, required, children, className, ...rest }: FormSelectProps) {
  const errorId = `${name}-error`
  return (
    <FormField name={name} label={label} error={error} required={required}>
      <select
        id={name}
        name={name}
        required={required}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${inputCls} w-full ${className ?? ''}`}
        {...rest}
      >
        {children}
      </select>
    </FormField>
  )
}
