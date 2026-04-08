import { useCallback, useMemo, useState } from "react"

import { useDepartmentRolesListQuery } from "../queries/getDepartmentRoles"
import type { DepartmentRolesListFilters, PaginationState } from "../types"

const DEFAULT_PAGE_SIZE = 10
const LIST_STATUS = "active" as const

export function useDepartmentRoles() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE)

  const listFilters: DepartmentRolesListFilters = useMemo(
    () => ({
      page,
      pageSize,
      status: LIST_STATUS,
    }),
    [page, pageSize]
  )

  const query = useDepartmentRolesListQuery(listFilters)

  const data = query.data?.items ?? []
  const totalItems = query.data?.totalItems ?? 0

  const pagination: PaginationState = useMemo(
    () => ({
      page,
      pageSize,
      totalItems,
    }),
    [page, pageSize, totalItems]
  )

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
    pagination,
    listFilters,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  }
}
