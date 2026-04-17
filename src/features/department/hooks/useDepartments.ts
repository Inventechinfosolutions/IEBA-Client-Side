import { useCallback, useState } from "react"
import { useGetDepartments } from "../queries/getDepartments"
import type { DepartmentFilter } from "../types"

export function useDepartments(filters: DepartmentFilter, userId?: string) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  })

  const status: "active" | "inactive" = filters.inactive ? "inactive" : "active"
  const searchText = (filters.search ?? "").trim()
  const { data, isLoading, isFetching } = useGetDepartments({
    status,
    page: pagination.page,
    limit: pagination.pageSize,
    search: searchText,
    sort: "ASC",
    userId,
  })

  const departments = data?.items ?? []
  const totalItems = data?.total ?? 0

  const onPageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }))
  }, [])

  return {
    departments,
    totalItems,
    isLoading: isLoading || isFetching,
    pagination: {
      ...pagination,
      totalItems,
    },
    onPageChange,
    onPageSizeChange,
  }
}
