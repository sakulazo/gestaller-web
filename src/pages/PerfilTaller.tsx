// Perfil del taller (datos fiscales para membrete de documentos; fila única).

import { type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { FormField, FormInput } from '../components/Form'
import { useToast } from '../components/Toast'
import { useAuth } from '../hooks/useAuth'
import { useFormMutation } from '../hooks/useFormMutation'
import { btnSuccess } from '../components/ui'
import { getCompanyProfile, updateCompanyProfile } from '../services'
import { companyProfileSchema } from '../lib/validation'
import type { CompanyProfile, CompanyProfileInput } from '../types'

export default function PerfilTaller() {
  const { can } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['company-profile'],
    queryFn: getCompanyProfile,
  })
  const profile = query.data ?? null

  const { mutate: saveMutate, isPending, fieldErrors, generalError, resetErrors } = useFormMutation<CompanyProfile, CompanyProfileInput>({
    mutationFn: updateCompanyProfile,
    schema: companyProfileSchema,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-profile'] })
      toast.success('Datos del taller guardados correctamente')
    },
  })

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const str = (name: string) => {
      const v = String(form.get(name) ?? '').trim()
      return v || null
    }
    resetErrors()
    saveMutate({
      legal_name: String(form.get('legal_name') ?? ''),
      tax_id: str('tax_id'),
      rii_number: str('rii_number'),
      phone: str('phone'),
      email: str('email'),
      address: str('address'),
      postal_code: str('postal_code'),
      state: str('state'),
      city: str('city'),
    })
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-slate-800">Datos del taller</h1>
      <p className="mb-6 text-sm text-slate-500">
        Datos fiscales y de contacto del taller para su uso futuro en presupuestos y facturas.
      </p>

      {query.isLoading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl space-y-4">
          {generalError && (
            <div className="rounded border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
              {generalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <FormInput
                name="legal_name"
                label="Nombre del taller"
                required
                defaultValue={profile?.legal_name ?? ''}
                error={fieldErrors.legal_name}
              />
            </div>
            <FormInput
              name="tax_id"
              label="NIF / CIF"
              defaultValue={profile?.tax_id ?? ''}
              error={fieldErrors.tax_id}
            />
            <FormInput
              name="rii_number"
              label="N.º RII (Registro Industrial)"
              defaultValue={profile?.rii_number ?? ''}
              error={fieldErrors.rii_number}
            />
            <FormInput
              name="phone"
              label="Teléfono"
              defaultValue={profile?.phone ?? ''}
              error={fieldErrors.phone}
            />
            <FormInput
              name="email"
              label="Email"
              type="email"
              defaultValue={profile?.email ?? ''}
              error={fieldErrors.email}
            />
            <FormInput
              name="postal_code"
              label="Código postal"
              defaultValue={profile?.postal_code ?? ''}
              error={fieldErrors.postal_code}
            />
            <div className="col-span-2">
              <FormInput
                name="address"
                label="Dirección"
                defaultValue={profile?.address ?? ''}
                error={fieldErrors.address}
              />
            </div>
            <FormInput
              name="city"
              label="Ciudad"
              defaultValue={profile?.city ?? ''}
              error={fieldErrors.city}
            />
            <FormInput
              name="state"
              label="Provincia"
              defaultValue={profile?.state ?? ''}
              error={fieldErrors.state}
            />
          </div>

          <FormField name="" label="">
            <button
              type="submit"
              disabled={isPending || !can('company_profile.edit')}
              className={btnSuccess}
            >
              {isPending ? 'Guardando…' : 'Guardar'}
            </button>
            {!can('company_profile.edit') && (
              <p className="mt-2 text-xs text-slate-400">
                Sin permiso para modificar los datos del taller.
              </p>
            )}
          </FormField>
        </form>
      )}
    </div>
  )
}