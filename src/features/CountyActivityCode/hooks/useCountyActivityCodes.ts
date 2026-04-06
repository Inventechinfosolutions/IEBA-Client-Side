import { useCallback, useMemo, useRef, useState } from "react"

import type { Department } from "@/features/department/types"

import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
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
    row.catalogActivityCode,
    row.match,
  ]
    .join(" ")
    .toLowerCase()
    .includes(value)
}

export function useCountyActivityCodes(
  filters: CountyActivityFilterFormValues,
  departments: readonly Department[],
) {
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

  const rowsWithDepartmentLabels = useMemo(() => {
    const raw = query.data ?? []
    const nameById = new Map<number, string>()
    for (const d of departments) {
      const id = Number(d.id)
      const name = d.name.trim()
      if (!Number.isNaN(id) && name) nameById.set(id, name)
    }
    return raw.map((row) => {
      const ids = row.linkedDepartmentIds ?? []
      const names = ids
        .map((id) => nameById.get(id))
        .filter((n): n is string => Boolean(n?.trim()))
      names.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      const department = names.length > 0 ? names.join(", ") : row.department
      return { ...row, department }
    })
  }, [query.data, departments])

  const filteredRows = useMemo(() => {
    const rows = rowsWithDepartmentLabels
    return rows.filter(
      (row) =>
        includesSearch(row, filters.search) && (filters.inactive ? !row.active : true)
    )
  }, [rowsWithDepartmentLabels, filters.search, filters.inactive])

  const { primaryRows, subRowsByParentId } = useMemo(() => {
    const primary: CountyActivityCodeRow[] = []
    const byParent: Record<string, CountyActivityCodeRow[]> = {}

    for (const row of filteredRows) {
      if (row.rowType === CountyActivityGridRowType.SUB && row.parentId) {
        byParent[row.parentId] = [...(byParent[row.parentId] ?? []), row]
      } else {
        primary.push(row)
      }
    }

    return { primaryRows: primary, subRowsByParentId: byParent }
  }, [filteredRows])

  const totalItems = primaryRows.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize))
  const safePage = Math.min(pagination.page, totalPages)
  const start = (safePage - 1) * pagination.pageSize
  const end = start + pagination.pageSize
  const paginatedRows = primaryRows.slice(start, end)

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
    primaryRows,
    subRowsByParentId,
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
