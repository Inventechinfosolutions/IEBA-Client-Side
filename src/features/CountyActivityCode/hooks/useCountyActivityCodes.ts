import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useRef, useState } from "react"

import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
import { countyActivityCodeKeys } from "../keys"
import { useGetCountyActivityPagedList } from "../queries/getCountyActivityCodes"
import type {
  CountyActivityCodeRow,
  CountyActivityFilterFormValues,
  CountyActivityPagination,
} from "../types"

const DEFAULT_PAGINATION: CountyActivityPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
}

export function useCountyActivityCodes(
  filters: CountyActivityFilterFormValues,
  /** undefined = SuperAdmin (no filter). Set = restrict rows to activities linked to these dept IDs. */
  assignedDeptIds?: Set<number>,
) {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<CountyActivityPagination>(
    DEFAULT_PAGINATION,
  )

  // Convert Set to sorted array for stable query key + API call
  const assignedDepartmentIds = useMemo<number[] | undefined>(() => {
    if (assignedDeptIds === undefined) return undefined
    return [...assignedDeptIds].sort((a, b) => a - b)
  }, [assignedDeptIds])

  const catalogQuery = useGetCountyActivityPagedList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: filters.search.trim(),
    showInactive: filters.inactive,
    assignedDepartmentIds,
  })

  const catalogMeta = catalogQuery.data?.meta
  const serverTotalPages = catalogMeta?.totalPages

  if (
    serverTotalPages != null &&
    serverTotalPages >= 1 &&
    pagination.page > serverTotalPages
  ) {
    setPagination((p) =>
      p.page > serverTotalPages ? { ...p, page: serverTotalPages } : p,
    )
  }

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

  const mergedTopLevel = useMemo(() => {
    return catalogQuery.data?.rows ?? []
  }, [catalogQuery.data?.rows])

  const primaryRows = useMemo(() => {
    return [...mergedTopLevel].sort((a, b) =>
      a.countyActivityCode.localeCompare(b.countyActivityCode, undefined, {
        sensitivity: "base",
      })
    )
  }, [mergedTopLevel])

  const totalItems = catalogMeta?.totalItems ?? mergedTopLevel.length
  const totalPages =
    serverTotalPages != null && serverTotalPages >= 1
      ? serverTotalPages
      : Math.max(1, Math.ceil(totalItems / pagination.pageSize))

  const onPageChange = useCallback(
    (page: number) => {
      triggerPageLoading()
      setPagination((prev) => ({ ...prev, page }))
    },
    [triggerPageLoading],
  )

  const onPageSizeChange = useCallback(
    (nextPageSize: number) => {
      triggerPageLoading()
      const status = filters.inactive ? "inactive" : "active"
      const search = filters.search.trim()
      setPagination((prev) => ({ ...prev, pageSize: nextPageSize, page: 1 }))
      void queryClient.invalidateQueries({
        queryKey: countyActivityCodeKeys.pagedList({
          page: 1,
          pageSize: nextPageSize,
          search,
          status,
        }),
      })
    },
    [triggerPageLoading, queryClient, filters.inactive, filters.search],
  )

  return {
    rows: mergedTopLevel,
    primaryRows,
    subRowsByParentId: {},
    totalItems,
    isLoading:
      catalogQuery.isLoading ||
      catalogQuery.isFetching ||
      isPageLoading,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
      totalPages,
    },
    onPageChange,
    onPageSizeChange,
  }
}
