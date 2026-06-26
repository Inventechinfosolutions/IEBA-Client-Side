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
    }),
    [page, pageSize]
  )

  const query = useDepartmentRolesListQuery(listFilters)

  const rawData = query.data?.items ?? []

  const filteredData = useMemo(() => {
    if (!search?.trim()) return rawData
    const q = search.toLowerCase().trim()
    return rawData.filter((row) => {
      const matchDept = row.departmentName.toLowerCase().includes(q)
      const matchRoles = row.roles.some((r) => r.toLowerCase().includes(q))
      const matchChildren = row.children?.some((c) => c.roleName.toLowerCase().includes(q))
      return matchDept || matchRoles || matchChildren
    })
  }, [rawData, search])

  const totalItems = query.data?.totalItems ?? 0

  const handlePageChange = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  const handlePageSizeChange = useCallback((nextSize: number) => {
    setPageSize(nextSize)
    setPage(1)
  }, [])

  return {
    data: filteredData,
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
