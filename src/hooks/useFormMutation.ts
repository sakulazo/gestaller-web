// Hook que integra validación Zod + manejo de errores de API para formularios.

import { useCallback, useState } from 'react'
import { useMutation, type UseMutationResult } from '@tanstack/react-query'
import { emitToast } from '../components/Toast'
import { toApplicationError } from '../types/errors'
import type { ZodSchema } from 'zod'

interface UseFormMutationOptions<TData, TVariables> {
  mutationFn: (vars: TVariables) => Promise<TData>
  schema?: ZodSchema
  onSuccess?: (data: TData) => void
  onConflict?: (deletedId: number, message: string) => void
}

interface UseFormMutationResult<TData, TVariables> {
  mutate: (vars: TVariables) => void
  isPending: boolean
  fieldErrors: Record<string, string>
  generalError: string | null
  resetErrors: () => void
  mutation: UseMutationResult<TData, Error, TVariables>
}

export function useFormMutation<TData, TVariables>({
  mutationFn,
  schema,
  onSuccess,
  onConflict,
}: UseFormMutationOptions<TData, TVariables>): UseFormMutationResult<TData, TVariables> {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)

  const resetErrors = useCallback(() => {
    setFieldErrors({})
    setGeneralError(null)
  }, [])

  const wrappedMutationFn = useCallback(
    async (vars: TVariables): Promise<TData> => {
      resetErrors()

      // 1) Validación frontend con Zod
      if (schema) {
        const result = schema.safeParse(vars)
        if (!result.success) {
          const fieldMap: Record<string, string> = {}
          for (const issue of result.error.issues) {
            const key = String(issue.path[issue.path.length - 1] ?? 'detail')
            if (!(key in fieldMap)) {
              fieldMap[key] = issue.message
            }
          }
          setFieldErrors(fieldMap)
          throw new Error('VALIDATION_ERROR')
        }
      }

      // 2) Llamada a la API
      try {
        return await mutationFn(vars)
      } catch (err) {
        const appErr = toApplicationError(err)

        // CONFLICT con deleted_id → callback especial (modal de restaurar)
        if (appErr.code === 'CONFLICT' && appErr.deleted_id && onConflict) {
          onConflict(appErr.deleted_id, appErr.message)
          throw err
        }

        if (appErr.fields && Object.keys(appErr.fields).length > 0) {
          setFieldErrors(appErr.fields)
        } else if (appErr.code !== 'VALIDATION_ERROR') {
          setGeneralError(appErr.message)
          emitToast('error', appErr.message)
        }

        throw err
      }
    },
    [mutationFn, schema, resetErrors, onConflict],
  )

  const mutation = useMutation<TData, Error, TVariables>({
    mutationFn: wrappedMutationFn,
    onSuccess: (data) => {
      resetErrors()
      onSuccess?.(data)
    },
    onError: () => {},
  })

  return {
    mutate: mutation.mutate,
    isPending: mutation.isPending,
    fieldErrors,
    generalError,
    resetErrors,
    mutation,
  }
}
