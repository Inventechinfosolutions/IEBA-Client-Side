import { useCallback, useMemo, useState } from "react"

import { useDepartmentRolesListQuery } from "../queries/getDepartmentRoles"
import type { DepartmentRolesListFilters } from "../types"

const DEFAULT_PAGE_SIZE = 10
const LIST_STATUS = undefined

export function useDepartmentRoles(search?: string) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const listFilters: DepartmentRolesListFilters = useMemo(
    () => ({
      page,
      pageSize,
      status: LIST_STATUS,
      search: search?.trim() || undefined,
    }),
    [page, pageSize, search]
  )

  const query = useDepartmentRolesListQuery(listFilters)

  const data = query.data?.items ?? []
  const totalItems = query.data?.totalItems ?? 0

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handlePageSizeChange = useCallback((nextSize: number) => {
    setPageSize(nextSize)
    setPage(1)
  }, [])

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    pagination: useMemo(
      () => ({
        page,
        pageSize,
        totalItems,
      }),
      [page, pageSize, totalItems]
    ),
    listFilters,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  }
}
