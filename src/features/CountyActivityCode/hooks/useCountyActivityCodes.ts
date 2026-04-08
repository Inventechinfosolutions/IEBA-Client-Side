import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useMemo, useRef, useState } from "react"

import type { Department } from "@/features/department/types"

import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
import { countyActivityCodeKeys } from "../keys"
import {
  useGetCountyActivityActivePrimarySubPicker,
  useGetCountyActivityCodes,
  useGetCountyActivityPagedList,
  useGetCountyActivityTopLevel,
} from "../queries/getCountyActivityCodes"
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
  departments: readonly Department[],
) {
  const queryClient = useQueryClient()
  const [pagination, setPagination] = useState<CountyActivityPagination>(
    DEFAULT_PAGINATION,
  )

  const catalogQuery = useGetCountyActivityPagedList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    search: filters.search.trim(),
    showInactive: filters.inactive,
  })

  const hierarchyQuery = useGetCountyActivityCodes()

  /** `GET /activities/top-level` — table / primaryRows / activePrimaryCountyRows. */
  const topLevelQuery = useGetCountyActivityTopLevel()

  /** Aggregated active `GET /activities` — Sub modal “Primary Activity Code” only. */
  const subPickerQuery = useGetCountyActivityActivePrimarySubPicker()

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

  const mergedTopLevelFull = useMemo(() => {
    const rowsWithDepartmentLabels = applyDepartmentLabelsStatic(
      catalogQuery.data?.rows ?? [],
      departments,
    )

    const hierarchyRowsWithDept = applyDepartmentLabelsStatic(
      hierarchyQuery.data ?? [],
      departments,
    )

    const pageRows = rowsWithDepartmentLabels
    const primaryIds = new Set(
      pageRows
        .filter((r) => r.rowType === CountyActivityGridRowType.PRIMARY)
        .map((r) => r.id),
    )

    const useHierarchyChildren =
      hierarchyQuery.data != null && hierarchyRowsWithDept.length > 0

    const subByParent: Record<string, CountyActivityCodeRow[]> = {}

    if (useHierarchyChildren) {
      const statusMatchesFilter = (r: CountyActivityCodeRow) =>
        filters.inactive ? !r.active : r.active

      for (const r of hierarchyRowsWithDept) {
        if (r.rowType !== CountyActivityGridRowType.SUB || !r.parentId) continue
        if (!statusMatchesFilter(r)) continue
        if (!primaryIds.has(r.parentId)) continue
        subByParent[r.parentId] = [...(subByParent[r.parentId] ?? []), r]
      }
    }

    const topLevel: CountyActivityCodeRow[] = []
    for (const row of pageRows) {
      if (row.rowType === CountyActivityGridRowType.PRIMARY) {
        topLevel.push(row)
        continue
      }
      if (!row.parentId) {
        topLevel.push(row)
        continue
      }
      if (primaryIds.has(row.parentId)) {
        if (useHierarchyChildren) {
          continue
        }
        const pid = row.parentId
        subByParent[pid] = [...(subByParent[pid] ?? []), row]
        continue
      }
      topLevel.push(row)
    }

    return {
      mergedTopLevel: topLevel,
      pagePrimaryRows: topLevel.filter(
        (r) => r.rowType === CountyActivityGridRowType.PRIMARY,
      ),
      subRowsByParentId: subByParent,
    }
  }, [catalogQuery.data?.rows, hierarchyQuery.data, departments, filters.inactive])

  const { mergedTopLevel, pagePrimaryRows, subRowsByParentId } = mergedTopLevelFull

  const applyDepartmentLabels = useCallback(
    (raw: readonly CountyActivityCodeRow[]): CountyActivityCodeRow[] =>
      applyDepartmentLabelsStatic(raw, departments),
    [departments],
  )

  const topLevelRowsWithDept = useMemo(
    () => applyDepartmentLabels(topLevelQuery.data ?? []),
    [topLevelQuery.data, applyDepartmentLabels],
  )

  const subCountyParentPickerRows = useMemo(
    () => applyDepartmentLabels(subPickerQuery.data ?? []),
    [subPickerQuery.data, applyDepartmentLabels],
  )

  const isRootPrimary = (r: CountyActivityCodeRow) =>
    r.rowType === CountyActivityGridRowType.PRIMARY ||
    r.parentId == null ||
    r.parentId === ""

  const sortByCountyCode = (a: CountyActivityCodeRow, b: CountyActivityCodeRow) =>
    a.countyActivityCode.localeCompare(b.countyActivityCode, undefined, {
      sensitivity: "base",
    })

  const activePrimaryCountyRows = useMemo(() => {
    const fromTop = topLevelRowsWithDept.filter((r) => isRootPrimary(r) && r.active)
    if (fromTop.length > 0) {
      return [...fromTop].sort(sortByCountyCode)
    }

    const topLevelStillLoading =
      topLevelQuery.isPending ||
      (topLevelQuery.fetchStatus === "fetching" && topLevelQuery.data === undefined)

    if (topLevelStillLoading) {
      return [...pagePrimaryRows]
        .filter((r) => isRootPrimary(r) && r.active)
        .sort(sortByCountyCode)
    }

    return []
  }, [
    topLevelRowsWithDept,
    topLevelQuery.isPending,
    topLevelQuery.fetchStatus,
    topLevelQuery.data,
    pagePrimaryRows,
  ])

  const primaryRows = useMemo(() => {
    if (!filters.inactive) {
      return [...activePrimaryCountyRows]
    }
    return [...pagePrimaryRows]
      .filter((r) => isRootPrimary(r) && !r.active)
      .sort(sortByCountyCode)
  }, [filters.inactive, activePrimaryCountyRows, pagePrimaryRows])

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
    activePrimaryCountyRows,
    subCountyParentPickerRows,
    subRowsByParentId,
    totalItems,
    isLoading:
      catalogQuery.isLoading ||
      catalogQuery.isFetching ||
      hierarchyQuery.isLoading ||
      topLevelQuery.isLoading ||
      subPickerQuery.isLoading ||
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

function applyDepartmentLabelsStatic(
  raw: readonly CountyActivityCodeRow[],
  departments: readonly Department[],
): CountyActivityCodeRow[] {
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
}
