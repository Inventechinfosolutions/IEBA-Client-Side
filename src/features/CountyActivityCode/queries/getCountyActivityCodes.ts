import { useQuery, useQueryClient } from "@tanstack/react-query"

import {
  apiFetchActivityCodesCatalogAll,
  apiGetActivityCodesAllForType,
} from "@/features/master-code/api"
import type { MasterCodeTab } from "@/features/master-code/types"
import { masterCodeKeys } from "@/features/master-code/keys"

import { COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT } from "../constants"
import {
  apiGetCountyActivitiesCatalogAggregated,
  apiGetCountyActivitiesByDepartmentId,
  apiGetCountyActivitiesPage,
  apiGetCountyActivityCodeTableRows,
  apiGetCountyActivityForEdit,
  apiGetCountyActivityTopLevel,
  buildCountyActivityCatalogEnrichmentMapFromMasterCodes,
  mapCountyActivityListItemsToGridRows,
} from "../api/countyActivityApi"
import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
import { countyActivityCodeKeys } from "../keys"
import type { ActivityCatalogEnrichmentValue, CountyActivityPagedListParams } from "../types"

const CATALOG_ENRICHMENT_STALE_MS = 10 * 60_000
const MASTER_CODE_OPTIONS_STALE_MS = 60_000

async function fetchActivityCatalogEnrichmentMap(
  queryClient: ReturnType<typeof useQueryClient>,
): Promise<ReadonlyMap<string, ActivityCatalogEnrichmentValue>> {
  // Use fetchQuery (not ensureQueryData) so the enrichment map is always rebuilt
  // from up-to-date master-code data. ensureQueryData would serve a 10-min stale
  // cache even when the county table itself is refetching, causing SPMP / Match / %
  // to show stale defaults (false / "N" / 0) for newly added or updated master codes.
  const rows = await queryClient.fetchQuery({
    queryKey: masterCodeKeys.activityCodesCatalogAll(),
    queryFn: () => apiFetchActivityCodesCatalogAll({ inactiveOnly: false }),
    staleTime: CATALOG_ENRICHMENT_STALE_MS,
    gcTime: 30 * 60_000,
  })
  return buildCountyActivityCatalogEnrichmentMapFromMasterCodes(rows)
}

/** Full hierarchy grid: `GET /activities/hierarchy` + activity–department links + catalog enrichment. */
export function useGetCountyActivityCodes() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: countyActivityCodeKeys.lists(),
    queryFn: async () => {
      const enrichment = await fetchActivityCatalogEnrichmentMap(queryClient)
      return apiGetCountyActivityCodeTableRows(enrichment)
    },
    staleTime: 0,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/** Paginated `GET /activities` for the main county activity table. */
export function useGetCountyActivityPagedList(params: CountyActivityPagedListParams) {
  const queryClient = useQueryClient()
  const status = params.showInactive ? "inactive" : "active"
  const search = params.search.trim()

  return useQuery({
    queryKey: countyActivityCodeKeys.pagedList({
      page: params.page,
      pageSize: params.pageSize,
      search,
      status,
    }),
    queryFn: async () => {
      const enrichment = await fetchActivityCatalogEnrichmentMap(queryClient)
      const needsAggregatedCatalog =
        params.page === 1 && params.pageSize > COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT

      const payload = needsAggregatedCatalog
        ? await apiGetCountyActivitiesCatalogAggregated({
            search: search.length > 0 ? search : undefined,
            status,
            sort: "ASC",
          })
        : await apiGetCountyActivitiesPage({
            page: params.page,
            limit: Math.min(params.pageSize, COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT),
            search: search.length > 0 ? search : undefined,
            status,
            sort: "ASC",
          })
      const rows = mapCountyActivityListItemsToGridRows(payload.data, enrichment)
      return { rows, meta: payload.meta, raw: payload.data }
    },
    /** `0` so switching Inactive (query key `status` active ↔ inactive) always refetches instead of reusing fresh cache. */
    staleTime: 0,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/** Table + shared context: `GET /activities/top-level` (enriched, active primaries only). */
export function useGetCountyActivityTopLevel() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: countyActivityCodeKeys.topLevel(),
    queryFn: async () => {
      const enrichment = await fetchActivityCatalogEnrichmentMap(queryClient)
      const dtos = await apiGetCountyActivityTopLevel()
      const rows = mapCountyActivityListItemsToGridRows(dtos, enrichment)
      const primaries = rows.filter(
        (r) => r.rowType === CountyActivityGridRowType.PRIMARY && r.active,
      )
      primaries.sort((a, b) =>
        a.countyActivityCode.localeCompare(b.countyActivityCode, undefined, {
          sensitivity: "base",
        }),
      )
      return primaries
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/** Sub county modal only: full active catalog from `GET /activities`, then primary rows. */
export function useGetCountyActivityActivePrimarySubPicker() {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: countyActivityCodeKeys.activePrimarySubPicker(),
    queryFn: async () => {
      const enrichment = await fetchActivityCatalogEnrichmentMap(queryClient)
      const payload = await apiGetCountyActivitiesCatalogAggregated({
        status: "active",
        sort: "ASC",
      })
      const rows = mapCountyActivityListItemsToGridRows(payload.data, enrichment)
      const primaries = rows.filter(
        (r) => r.rowType === CountyActivityGridRowType.PRIMARY && r.active,
      )
      primaries.sort((a, b) =>
        a.countyActivityCode.localeCompare(b.countyActivityCode, undefined, {
          sensitivity: "base",
        }),
      )
      return primaries
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Master activity-code catalog: `GET /activity-codes` (no type filter).
 * Used for "Copy code" dropdowns in Add/Edit modals without hitting `/master-codes`.
 */
export function useGetMasterActivityCatalog(enabled: boolean) {
  return useQuery({
    queryKey: masterCodeKeys.activityCodesCatalogAll(),
    queryFn: () => apiFetchActivityCodesCatalogAll({ inactiveOnly: false }),
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  })
}


export function useGetCountyActivityMasterCodes(codeType: string, enabled: boolean) {
  const typeSelected = codeType.trim().length > 0
  const typeTrimmed = codeType.trim()

  return useQuery({
    queryKey: countyActivityCodeKeys.masterCodeOptionsByType(typeTrimmed),
    queryFn: async () => {
      const res = await apiGetActivityCodesAllForType({
        codeType: typeTrimmed as MasterCodeTab,
        inactiveOnly: false,
      })
      return {
        items: res.items,
        totalItems: res.totalItems,
      }
    },
    enabled: enabled && typeSelected,
    staleTime: MASTER_CODE_OPTIONS_STALE_MS,
    gcTime: 5 * 60_000,
    refetchOnMount: "always",
  })
}

/** `GET /activities/:id` plus department names for add/edit flows. */
export function useGetCountyActivityForEdit(activityId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: activityId
      ? countyActivityCodeKeys.activityDetail(activityId)
      : [...countyActivityCodeKeys.all, "activity-detail", "idle"] as const,
    queryFn: () => apiGetCountyActivityForEdit(Number(activityId)),
    enabled: Boolean(enabled && activityId),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
  })
}

export function useGetActivitiesByDepartment(departmentId: number | null) {
  return useQuery({
    queryKey: [...countyActivityCodeKeys.all, "by-department", departmentId],
    queryFn: () => apiGetCountyActivitiesByDepartmentId(Number(departmentId)),
    enabled: !!departmentId,
    staleTime: 30_000,
  })
}
