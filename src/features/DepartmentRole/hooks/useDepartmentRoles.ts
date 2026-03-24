import { useState, useCallback } from "react"

import { useGetDepartmentRoles } from "../queries/getDepartmentRoles"
import type { PaginationState } from "../types"

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 5,
  totalItems: 0,
}

export function useDepartmentRoles() {
  const query = useGetDepartmentRoles()
  const [pagination, setPagination] = useState<PaginationState>({
    ...DEFAULT_PAGINATION,
    totalItems: query.data?.length ?? 0,
  })

  const data = query.data ?? []
  const totalItems = data.length

  const paginationWithTotal: PaginationState = {
    ...pagination,
    totalItems,
  }

  const handlePageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({
      ...prev,
      pageSize,
      page: 1,
    }))
  }, [])

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    pagination: paginationWithTotal,
    onPageChange: handlePageChange,
    onPageSizeChange: handlePageSizeChange,
  }
}
