import { useCallback, useMemo, useState } from "react"

import { listItemToTableRow } from "../api/costPoolApi"
import { CostPoolStatus } from "../enums/cost-pool.enum"
import { useCostPoolListQuery } from "../queries/getCostPools"
import type { CostPoolFilterFormValues, CostPoolPagination, CostPoolRow } from "../types"

const DEFAULT_PAGINATION: CostPoolPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
}

export function useCostPools(filters: CostPoolFilterFormValues) {
  const [pagination, setPagination] = useState<CostPoolPagination>(DEFAULT_PAGINATION)

  const listParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.pageSize,
      search: filters.search.trim() === "" ? undefined : filters.search.trim(),
      // Checked: only inactive. Unchecked: only active (backend expects explicit enum; omitting the param returns all statuses).
      costpoolStatus: filters.inactive
        ? CostPoolStatus.INACTIVE
        : CostPoolStatus.ACTIVE,
    }),
    [pagination.page, pagination.pageSize, filters.search, filters.inactive],
  )

  const query = useCostPoolListQuery(listParams)

  const listPayload = query.data

  const rows: CostPoolRow[] = useMemo(
    () => (listPayload?.data ?? []).map(listItemToTableRow),
    [listPayload],
  )

  const totalItems = listPayload?.meta.totalItems ?? 0

  const onPageChange = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const onPageSizeChange = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize, page: 1 }))
  }, [])

  return {
    rows,
    totalItems,
    isLoading: query.isPending || query.isFetching,
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems,
    },
    onPageChange,
    onPageSizeChange,
  }
}
