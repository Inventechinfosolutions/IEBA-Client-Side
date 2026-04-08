import { useCallback, useMemo, useState } from "react"
import { useGetDepartments } from "../queries/getDepartments"
import type { DepartmentFilter } from "../types"

export function useDepartments(filters: DepartmentFilter) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  })

  const status: "active" | "inactive" = filters.inactive ? "inactive" : "active"
  const searchText = (filters.search ?? "").trim()
  const hasSearch = searchText.length > 0
  const queryPage = hasSearch ? 1 : pagination.page
  const queryLimit = hasSearch ? 100 : pagination.pageSize

  const { data, isLoading, isFetching } = useGetDepartments({
    status,
    page: queryPage,
    limit: queryLimit,
    search: searchText,
    sort: "ASC",
  })

  const apiItems = data?.items ?? []
  const apiTotal = data?.total ?? 0

  const filteredAndPaginated = useMemo(() => {
    if (!hasSearch) {
      return { items: apiItems, totalItems: apiTotal }
    }

    const q = searchText.toLowerCase()
    const filtered = apiItems.filter((dept) => {
      const code = dept.code.toLowerCase()
      const name = dept.name.toLowerCase()
      return code.includes(q) || name.includes(q)
    })

    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return { items: filtered.slice(start, end), totalItems: filtered.length }
  }, [apiItems, apiTotal, searchText, hasSearch, pagination.page, pagination.pageSize])

  const onPageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }))
  }, [])

  return {
    departments: filteredAndPaginated.items,
    totalItems: filteredAndPaginated.totalItems,
    isLoading: isLoading || isFetching,
    pagination: {
      ...pagination,
      totalItems: filteredAndPaginated.totalItems,
    },
    onPageChange,
    onPageSizeChange,
  }
}
