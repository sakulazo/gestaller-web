/* Hook de listados paginados con React Query.
 *
 * - queryKey: [baseKey, { page, search }] — comparte prefijo con los
 *   consumidores en modo `all` para que `invalidateQueries` invalide ambos.
 * - Cambiar `search` resetea a page 1 (con debounce).
 */
import { useEffect, useState } from 'react'

import { useQuery } from '@tanstack/react-query'

import type { ListParams, Paginated } from '../types'

export interface UsePaginatedQueryOptions {
  searchDebounceMs?: number
}

export function usePaginatedQuery<T>(
  baseKey: string[],
  fetcher: (params: ListParams) => Promise<Paginated<T>>,
  options: UsePaginatedQueryOptions = {},
) {
  const debounce = options.searchDebounceMs ?? 300
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search), debounce)
    return () => window.clearTimeout(id)
  }, [search, debounce])

  // Un cambio de búsqueda reinicia a la primera página.
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const query = useQuery({
    queryKey: [...baseKey, { page, search: debouncedSearch }],
    queryFn: () => fetcher({ page, search: debouncedSearch || undefined }),
  })

  const items = query.data?.items ?? []
  const total = query.data?.total ?? 0
  const pageSize = query.data?.page_size ?? 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return {
    items,
    total,
    page,
    totalPages,
    pageSize,
    setPage,
    search,
    setSearch,
    isLoading: query.isPending,
    isFetching: query.isFetching,
    refetch: query.refetch,
    error: query.error,
  }
}