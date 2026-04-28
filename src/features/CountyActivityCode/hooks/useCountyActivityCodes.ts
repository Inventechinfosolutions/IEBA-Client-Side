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

  const hierarchyQuery = useGetCountyActivityCodes()

  /** `GET /activities/top-level` — table / primaryRows / activePrimaryCountyRows. */
  const topLevelQuery = useGetCountyActivityTopLevel()

  /** Aggregated active `GET /activities` — Sub modal “Primary Activity Code” only. */
  const subPickerQuery = useGetCountyActivityActivePrimarySubPicker(assignedDepartmentIds)

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
    
    // Identify all rows that have NO parent (these are the headers/root rows)
    const primaryIdsOnPage = new Set(
      pageRows
        .filter((r) => !r.parentId)
        .map((r) => String(r.id)),
    )

    const useHierarchyChildren =
      hierarchyQuery.data != null && hierarchyRowsWithDept.length > 0

    const rowById = new Map<string, CountyActivityCodeRow>()
    if (useHierarchyChildren) {
      for (const r of hierarchyRowsWithDept) {
        rowById.set(String(r.id), r)
      }
    }

    // Identify parents of any rows that have a parent (check row itself and hierarchy fallback)
    const parentIdsOfSubsOnPage = new Set<string>()
    for (const r of pageRows) {
      const rid = String(r.id)
      let pid = r.parentId ? String(r.parentId) : null
      if (!pid && useHierarchyChildren) {
        pid = rowById.get(rid)?.parentId ? String(rowById.get(rid)?.parentId) : null
      }
      if (pid) {
        parentIdsOfSubsOnPage.add(pid)
      }
    }

    // All primary IDs that we need to act as "Headers" for this page
    const allRelevantPrimaryIds = new Set([...primaryIdsOnPage, ...parentIdsOfSubsOnPage])

    const subByParent: Record<string, CountyActivityCodeRow[]> = {}

    if (useHierarchyChildren) {
      for (const r of hierarchyRowsWithDept) {
        const rid = String(r.id)
        let pid = r.parentId ? String(r.parentId) : null
        if (!pid) continue

        if (!allRelevantPrimaryIds.has(pid)) continue

        const parentIsOnPage = primaryIdsOnPage.has(pid)
        
        let includeSub = false
        if (filters.inactive) {
          // Inactive table: only show children if the parent is also inactive (on page)
          includeSub = parentIsOnPage
        } else {
          // Active table: always show children if the parent is active (regardless of child's active status)
          const parentRow = rowById.get(pid)
          includeSub = (parentRow ? parentRow.active : true)
        }

        if (includeSub) {
          subByParent[pid] = [...(subByParent[pid] ?? []), r]
        }
      }
    }

    const topLevel: CountyActivityCodeRow[] = []
    const seenIds = new Set<string>()

    for (const row of pageRows) {
      const rowId = String(row.id)
      if (seenIds.has(rowId)) continue

      let pid = row.parentId ? String(row.parentId) : null
      if (!pid && useHierarchyChildren) {
        // Fallback to hierarchy to see if this is actually a sub
        pid = rowById.get(rowId)?.parentId ? String(rowById.get(rowId)?.parentId) : null
      }
      
      // If it still has no parent, it's a top-level primary row
      if (!pid) {
        topLevel.push(row)
        seenIds.add(rowId)
        continue
      }

      // If it has a parent, try to group it
      if (allRelevantPrimaryIds.has(pid)) {
        const parentRow = rowById.get(pid)

        if (filters.inactive) {
          // Inactive mode: if parent is ACTIVE, hide the child from the inactive table
          if (parentRow && parentRow.active) {
            continue
          }
        } else {
          // Active mode: if parent is INACTIVE, hide the child from the active table
          if (parentRow && !parentRow.active) {
            continue
          }
        }

        // Pull in the primary header if it's not on the page yet
        if (!primaryIdsOnPage.has(pid) && !seenIds.has(pid)) {
          if (parentRow) {
            topLevel.push(parentRow)
            seenIds.add(pid)
          }
        }
        
        if (primaryIdsOnPage.has(pid) || seenIds.has(pid)) {
          if (!useHierarchyChildren) {
            subByParent[pid] = [...(subByParent[pid] ?? []), row]
          }
          continue
        }
      }

      topLevel.push(row)
      seenIds.add(rowId)
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
