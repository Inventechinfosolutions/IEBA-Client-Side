import type { QueryClient, QueryKey } from "@tanstack/react-query"

import { masterCodeKeys } from "@/features/master-code/keys"

import {
  buildCountyActivityGridRowAfterUpdate,
  buildCountyActivityPrimaryGridRowAfterCreate,
  buildCountyActivitySubGridRowAfterCreate,
  mergeCountyActivityDtoAfterUpdate,
} from "../api/countyActivityApi"
import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
import { countyActivityCodeKeys } from "../keys"
import type {
  ActivityCatalogEnrichmentMap,
  ActivityCatalogEnrichmentValue,
  ApiCountyActivityCreateResponse,
  CountyActivityAddFormValues,
  CountyActivityCodeRow,
  CountyActivityEditPayload,
  CreateCountyActivityApiInput,
  PagedCountyActivityData,
  PagedListParams,
  UpdateCountyActivityApiInput,
} from "../types"

function readEnrichmentMap(
  queryClient: QueryClient,
): ReadonlyMap<string, ActivityCatalogEnrichmentValue> {
  const raw = queryClient.getQueryData<unknown>(masterCodeKeys.activityCodesCatalogEnrichment())
  if (raw instanceof Map) return raw as ActivityCatalogEnrichmentMap
  return new Map()
}

function rowMatchesSearch(row: CountyActivityCodeRow, search: string): boolean {
  const s = search.trim().toLowerCase()
  if (!s) return true
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
    .includes(s)
}

function insertRowSortedByActivityCode(
  rows: readonly CountyActivityCodeRow[],
  row: CountyActivityCodeRow,
): CountyActivityCodeRow[] {
  const next = [...rows]
  const idx = next.findIndex(
    (r) =>
      r.countyActivityCode.localeCompare(row.countyActivityCode, undefined, {
        sensitivity: "base",
      }) > 0,
  )
  if (idx === -1) next.push(row)
  else next.splice(idx, 0, row)
  return next
}

function sortDepartmentNamesFromForm(departmentField: string): string[] {
  return [
    ...new Set(departmentField.split(",").map((s) => s.trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
}

function resolveParentCatalogForSubCreate(
  queryClient: QueryClient,
  parentId: string,
  values: CountyActivityAddFormValues,
): { activityCodeType: string; activityCode: string } {
  const id = parentId.trim()

  const fromLists = queryClient.getQueryData<CountyActivityCodeRow[]>(
    countyActivityCodeKeys.lists(),
  )
  const inHierarchy = fromLists?.find((r) => r.id === id)
  if (inHierarchy?.catalogActivityCode.trim()) {
    return {
      activityCodeType: inHierarchy.masterCodeType.trim(),
      activityCode: inHierarchy.catalogActivityCode.trim(),
    }
  }

  const subPickerRows = queryClient.getQueryData<CountyActivityCodeRow[]>(
    countyActivityCodeKeys.activePrimarySubPicker(),
  )
  const inSubPicker = subPickerRows?.find((r) => r.id === id)
  if (inSubPicker?.catalogActivityCode.trim()) {
    return {
      activityCodeType: inSubPicker.masterCodeType.trim(),
      activityCode: inSubPicker.catalogActivityCode.trim(),
    }
  }

  const tableTopRows = queryClient.getQueryData<CountyActivityCodeRow[]>(
    countyActivityCodeKeys.topLevel(),
  )
  const inTableTop = tableTopRows?.find((r) => r.id === id)
  if (inTableTop?.catalogActivityCode.trim()) {
    return {
      activityCodeType: inTableTop.masterCodeType.trim(),
      activityCode: inTableTop.catalogActivityCode.trim(),
    }
  }

  const detail = queryClient.getQueryData<CountyActivityEditPayload>(
    countyActivityCodeKeys.activityDetail(id),
  )
  const act = detail?.activity
  if (act?.activityCode?.trim()) {
    return {
      activityCodeType: act.activityCodeType.trim(),
      activityCode: act.activityCode.trim(),
    }
  }

  return {
    activityCodeType: values.masterCodeType.trim(),
    activityCode: String(values.masterCode),
  }
}

function invalidateAllCountyActivityCaches(
  queryClient: QueryClient,
  input: UpdateCountyActivityApiInput,
): void {
  void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.lists() })
  void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.pagedLists() })
  void queryClient.invalidateQueries({
    queryKey: countyActivityCodeKeys.activityDetail(input.id),
  })
  if (input.rowType === CountyActivityGridRowType.PRIMARY) {
    void queryClient.invalidateQueries({
      queryKey: countyActivityCodeKeys.activePrimarySubPicker(),
    })
    void queryClient.invalidateQueries({
      queryKey: countyActivityCodeKeys.topLevel(),
    })
  }
}

/**
 * After creating a primary row: update paged + top-level caches without refetching hierarchy
 * when possible (same idea as master-code `setQueryData` / targeted invalidation).
 */
export function applyCountyActivityQueryCacheAfterPrimaryCreate(
  queryClient: QueryClient,
  input: CreateCountyActivityApiInput,
  res: ApiCountyActivityCreateResponse,
): void {
  let row: CountyActivityCodeRow
  try {
    row = buildCountyActivityPrimaryGridRowAfterCreate(input, res, readEnrichmentMap(queryClient))
  } catch {
    return
  }

  const listStatus = row.active ? "active" : "inactive"

  const pagedQueries = queryClient.getQueryCache().findAll({
    queryKey: countyActivityCodeKeys.pagedLists(),
    exact: false,
  })

  const pagedKeysToRefetch: QueryKey[] = []

  for (const q of pagedQueries) {
    const key = q.queryKey
    const params = key[2] as PagedListParams | undefined
    if (params == null || typeof params !== "object") continue
    if (params.status !== listStatus) continue
    if (!rowMatchesSearch(row, params.search)) continue

    queryClient.setQueryData<PagedCountyActivityData>(key as QueryKey, (old) => {
      if (!old?.meta || !Array.isArray(old.rows)) return old
      if (old.rows.some((r) => r.id === row.id)) return old

      const pageSize = params.pageSize
      const nextTotal = old.meta.totalItems + 1
      const nextTotalPages = Math.max(1, Math.ceil(nextTotal / pageSize))

      if (params.page === 1) {
        const merged = insertRowSortedByActivityCode(old.rows, row)
        if (merged.length > pageSize) {
          pagedKeysToRefetch.push(key as QueryKey)
          return old
        }
        return {
          rows: merged,
          meta: {
            ...old.meta,
            totalItems: nextTotal,
            totalPages: nextTotalPages,
            itemCount: merged.length,
          },
          raw: old.raw,
        }
      }

      return {
        ...old,
        meta: {
          ...old.meta,
          totalItems: nextTotal,
          totalPages: nextTotalPages,
        },
      }
    })
  }

  for (const refetchKey of pagedKeysToRefetch) {
    void queryClient.invalidateQueries({ queryKey: refetchKey })
  }

  for (const topKey of [
    countyActivityCodeKeys.activePrimarySubPicker(),
    countyActivityCodeKeys.topLevel(),
  ] as const) {
    if (row.active) {
      const prev = queryClient.getQueryData<CountyActivityCodeRow[]>(topKey)
      if (prev == null || !Array.isArray(prev)) {
        void queryClient.invalidateQueries({ queryKey: topKey })
      } else if (!prev.some((r) => r.id === row.id)) {
        queryClient.setQueryData<CountyActivityCodeRow[]>(
          topKey,
          insertRowSortedByActivityCode(prev, row),
        )
      }
    }
  }
}

/** After creating a sub row: patch hierarchy list cache and refresh paged slices. */
export function applyCountyActivityQueryCacheAfterSubCreate(
  queryClient: QueryClient,
  input: CreateCountyActivityApiInput,
  res: ApiCountyActivityCreateResponse,
): void {
  const parentId = input.parentId?.trim() ?? ""
  if (parentId === "") return

  let row: CountyActivityCodeRow
  try {
    row = buildCountyActivitySubGridRowAfterCreate(
      input,
      res,
      readEnrichmentMap(queryClient),
      resolveParentCatalogForSubCreate(queryClient, parentId, input.values),
    )
  } catch {
    return
  }

  const listKey = countyActivityCodeKeys.lists()
  queryClient.setQueryData<CountyActivityCodeRow[]>(listKey, (old) => {
    if (old == null || !Array.isArray(old)) return old
    if (old.some((r) => r.id === row.id)) return old
    return [...old, row]
  })

  void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.pagedLists() })
}

/** After `PUT /activities/:id`: sync detail, hierarchy slice, and paged rows when possible. */
export function applyCountyActivityQueryCacheAfterUpdate(
  queryClient: QueryClient,
  input: UpdateCountyActivityApiInput,
): void {
  const id = input.id.trim()
  const detailKey = countyActivityCodeKeys.activityDetail(id)
  const prevDetail = queryClient.getQueryData<CountyActivityEditPayload>(detailKey)

  if (prevDetail?.activity == null) {
    invalidateAllCountyActivityCaches(queryClient, input)
    return
  }

  const nextActivity = mergeCountyActivityDtoAfterUpdate(prevDetail.activity, input)
  const departmentNames = sortDepartmentNamesFromForm(input.values.department)

  queryClient.setQueryData<CountyActivityEditPayload>(detailKey, {
    activity: { ...nextActivity, departments: undefined },
    departmentNames,
  })

  const listKey = countyActivityCodeKeys.lists()
  const listRows = queryClient.getQueryData<CountyActivityCodeRow[]>(listKey) ?? []
  const prevRow = listRows.find((r) => r.id === id)

  if (prevRow == null) {
    void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.pagedLists() })
    if (input.rowType === CountyActivityGridRowType.PRIMARY) {
      void queryClient.invalidateQueries({
        queryKey: countyActivityCodeKeys.activePrimarySubPicker(),
      })
      void queryClient.invalidateQueries({
        queryKey: countyActivityCodeKeys.topLevel(),
      })
    }
    return
  }

  const enrichment = readEnrichmentMap(queryClient)
  const nextRow = buildCountyActivityGridRowAfterUpdate(input, prevRow, enrichment)
  const statusFlip = prevRow.active !== nextRow.active

  queryClient.setQueryData<CountyActivityCodeRow[]>(listKey, (old) => {
    if (old == null || !Array.isArray(old)) return old
    return old.map((r) => (r.id === id ? nextRow : r))
  })

  if (statusFlip) {
    void queryClient.invalidateQueries({ queryKey: countyActivityCodeKeys.pagedLists() })
  } else {
    const pagedQueries = queryClient.getQueryCache().findAll({
      queryKey: countyActivityCodeKeys.pagedLists(),
      exact: false,
    })

    for (const q of pagedQueries) {
      const key = q.queryKey
      const params = key[2] as PagedListParams | undefined
      if (params == null || typeof params !== "object") continue

      const bucketActive = params.status === "active"
      if (bucketActive !== nextRow.active) continue

      queryClient.setQueryData<PagedCountyActivityData>(key as QueryKey, (old) => {
        if (old?.meta == null || !Array.isArray(old.rows)) return old
        const idx = old.rows.findIndex((r) => r.id === id)
        if (idx === -1) return old
        if (!rowMatchesSearch(nextRow, params.search)) {
          const rows = old.rows.filter((r) => r.id !== id)
          const nextTotal = Math.max(0, old.meta.totalItems - 1)
          const nextTotalPages = Math.max(1, Math.ceil(nextTotal / params.pageSize))
          return {
            ...old,
            rows,
            meta: {
              ...old.meta,
              totalItems: nextTotal,
              totalPages: nextTotalPages,
              itemCount: rows.length,
            },
          }
        }
        const rows = old.rows.map((r) => (r.id === id ? nextRow : r))
        return { ...old, rows }
      })
    }
  }

  if (input.rowType !== CountyActivityGridRowType.PRIMARY) return

  for (const topKey of [
    countyActivityCodeKeys.activePrimarySubPicker(),
    countyActivityCodeKeys.topLevel(),
  ] as const) {
    const topRows = queryClient.getQueryData<CountyActivityCodeRow[]>(topKey)

    if (topRows == null || !Array.isArray(topRows)) {
      if (nextRow.active) {
        void queryClient.invalidateQueries({ queryKey: topKey })
      }
      continue
    }

    if (!nextRow.active) {
      queryClient.setQueryData<CountyActivityCodeRow[]>(
        topKey,
        topRows.filter((r) => r.id !== id),
      )
      continue
    }

    const idx = topRows.findIndex((r) => r.id === id)
    if (idx !== -1) {
      const rows = [...topRows]
      rows[idx] = nextRow
      queryClient.setQueryData<CountyActivityCodeRow[]>(topKey, rows)
      continue
    }

    if (statusFlip) {
      void queryClient.invalidateQueries({ queryKey: topKey })
      continue
    }

    queryClient.setQueryData<CountyActivityCodeRow[]>(
      topKey,
      insertRowSortedByActivityCode(topRows, nextRow),
    )
  }
}
