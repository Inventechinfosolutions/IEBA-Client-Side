import { useCallback, useMemo, useRef, useState } from "react"

import { useGetCountyActivityCodes } from "../queries/getCountyActivityCodes"
import type {
  CountyActivityCodeRow,
  CountyActivityFilterFormValues,
  CountyActivityPagination,
} from "../types"

const DEFAULT_PAGINATION: CountyActivityPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
}

function includesSearch(row: CountyActivityCodeRow, searchValue: string): boolean {
  const value = searchValue.trim().toLowerCase()
  if (!value) return true
  return [
    row.countyActivityCode,
    row.countyActivityName,
    row.description,
    row.masterCodeType,
    String(row.masterCode),
    row.match,
  ]
    .join(" ")
    .toLowerCase()
    .includes(value)
}

export function useCountyActivityCodes(filters: CountyActivityFilterFormValues) {
  const [pagination, setPagination] = useState<CountyActivityPagination>(
    DEFAULT_PAGINATION
  )
  const query = useGetCountyActivityCodes()
  const [isPageLoading, setIsPageLoading] = useState(false)
  const pageLoadingTimeoutRef = useRef<number | null>(null)

  const triggerPageLoading = useCallback(() => {
    if (pageLoadingTimeoutRef.current !== null) {
      window.clearTimeout(pageLoadingTimeoutRef.current)
    }

    setIsPageLoading(true)
    pageLoadingTimeoutRef.current = window.setTimeout(() => {
      setIsPageLoading(false)
      pageLoadingTimeoutRef.current = null
    }, 300)
  }, [])

  const filteredRows = useMemo(() => {
    const rows = query.data ?? []
    return rows.filter(
      (row) =>
        includesSearch(row, filters.search) && (filters.inactive ? !row.active : true)
    )
  }, [query.data, filters.search, filters.inactive])

  const totalItems = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize))
  const safePage = Math.min(pagination.page, totalPages)
  const start = (safePage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  const paginatedRows = filteredRows.slice(start, end)

  const onPageChange = useCallback((page: number) => {
    triggerPageLoading()
    setPagination((prev) => ({ ...prev, page }))
  }, [triggerPageLoading])

  const onPageSizeChange = useCallback((pageSize: number) => {
    triggerPageLoading()
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }))
  }, [triggerPageLoading])

  return {
    rows: paginatedRows,
    totalItems,
    isLoading: query.isLoading || isPageLoading,
    pagination: {
      page: safePage,
      pageSize: pagination.pageSize,
      totalItems,
    },
    onPageChange,
    onPageSizeChange,
  }
}
