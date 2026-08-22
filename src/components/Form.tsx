// Componentes de formulario reutilizables con soporte de errores.

import { type ReactNode } from 'react'
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
