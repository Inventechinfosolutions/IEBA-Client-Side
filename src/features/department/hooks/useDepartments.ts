import { useCallback, useMemo, useState } from "react"
import { useGetDepartments } from "../queries/getDepartments"
import type { DepartmentFilter } from "../types"

export function useDepartments(filters: DepartmentFilter) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
  })

  const { data: allDepartments = [], isLoading, isFetching } = useGetDepartments()

  const filteredDepartments = useMemo(() => {
    return allDepartments.filter((dept) => {
      const matchesSearch = filters.search
        ? dept.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          dept.code.toLowerCase().includes(filters.search.toLowerCase())
        : true
      const matchesInactive = filters.inactive ? !dept.active : dept.active
      return matchesSearch && matchesInactive
    })
  }, [allDepartments, filters.search, filters.inactive])

  const paginatedDepartments = useMemo(() => {
    const start = (pagination.page - 1) * pagination.pageSize
    const end = start + pagination.pageSize
    return filteredDepartments.slice(start, end)
  }, [filteredDepartments, pagination.page, pagination.pageSize])

  const onPageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }))
  }, [])

  return {
    departments: paginatedDepartments,
    totalItems: filteredDepartments.length,
    isLoading: isLoading || isFetching,
    pagination: {
      ...pagination,
      totalItems: filteredDepartments.length,
    },
    onPageChange,
    onPageSizeChange,
  }
}
