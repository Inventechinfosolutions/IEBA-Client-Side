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
  apiGetCountyActivitiesAllActive,
  apiGetCountyActivityForEdit,
  apiGetCountyActivityNested,
  mapCountyActivityListItemsToGridRows,
} from "../api/countyActivityApi"
import { CountyActivityGridRowType } from "../enums/CountyActivity.enum"
import { countyActivityCodeKeys } from "../keys"
import type { CountyActivityPagedListParams } from "../types"


/** Paginated `GET /activities` for the main county activity table. */
export function useGetCountyActivityPagedList(params: CountyActivityPagedListParams) {
  const status = params.showInactive ? "inactive" : "active"
  const search = params.search.trim()
  const departmentIds = params.assignedDepartmentIds ?? []

  return useQuery({
    queryKey: countyActivityCodeKeys.pagedList({
      page: params.page,
      pageSize: params.pageSize,
      search,
      status,
      departmentIds: departmentIds.length > 0 ? departmentIds : undefined,
    }),
    queryFn: async () => {
      const needsAggregatedCatalog =
        params.page === 1 && params.pageSize > COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT

      const payload = needsAggregatedCatalog
        ? await apiGetCountyActivitiesCatalogAggregated({
          search: search.length > 0 ? search : undefined,
          status,
          sort: "ASC",
          departmentIds: departmentIds.length > 0 ? departmentIds : undefined,
        })
        : await apiGetCountyActivitiesPage({
          page: params.page,
          limit: Math.min(params.pageSize, COUNTY_ACTIVITY_ACTIVITIES_API_MAX_LIMIT),
          search: search.length > 0 ? search : undefined,
          status,
          sort: "ASC",
          departmentIds: departmentIds.length > 0 ? departmentIds : undefined,
        })
      // spmp/match/percent come directly from the activities API response;
      // pass an empty enrichment map (the fallback is no longer needed).
      const rows = mapCountyActivityListItemsToGridRows(payload.data, new Map())
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

/** Sub county modal only: full active catalog from `GET /activities?status=active` (no pagination/sorting). */
export function useGetCountyActivityActivePrimarySubPicker(assignedDepartmentIds?: number[], enabled = true) {
  const deptIds = assignedDepartmentIds && assignedDepartmentIds.length > 0 ? assignedDepartmentIds : undefined

  return useQuery({
    queryKey: [...countyActivityCodeKeys.activePrimarySubPicker(), { departmentIds: deptIds }] as const,
    queryFn: async () => {
      const payload = await apiGetCountyActivitiesAllActive({
        departmentIds: deptIds,
      })
      // spmp/match/percent come directly from the activities API response.
      const rows = mapCountyActivityListItemsToGridRows(payload.data, new Map())
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
    enabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/** Fetch direct child rows dynamically under an expanded parent county activity. */
export function useGetCountyActivityNested(parentId: number | null, enabled: boolean) {
  return useQuery({
    queryKey: countyActivityCodeKeys.nestedActivities(parentId ?? 0),
    queryFn: async () => {
      if (parentId == null) return []
      // spmp/match/percent already come from the nested activities API response.
      const dtos = await apiGetCountyActivityNested(parentId)
      return mapCountyActivityListItemsToGridRows(dtos, new Map())
    },
    enabled: enabled && parentId != null,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  })
}

/**
 * Imperative helper: fetch (or return cached) direct children for a parent.
 * Used inside CountyActivityCodeTable edit handlers to check for sub-county rows
 * without mounting a hook.
 */
export async function fetchCountyActivityNestedRows(
  queryClient: ReturnType<typeof useQueryClient>,
  parentId: number,
) {
  return queryClient.fetchQuery({
    queryKey: countyActivityCodeKeys.nestedActivities(parentId),
    queryFn: async () => {
      // spmp/match/percent already come from the nested activities API response.
      const dtos = await apiGetCountyActivityNested(parentId)
      return mapCountyActivityListItemsToGridRows(dtos, new Map())
    },
    staleTime: 30_000,
  })
}


/**
 * Master activity-code catalog: `GET /activity-codes` (no type filter).
 * Used for "Copy code" dropdowns in Add/Edit modals without hitting `/master-codes`.
 */
export function useGetMasterActivityCatalog(enabled: boolean) {
  console.log("useGetMasterActivityCatalog called with enabled:", enabled);
  return useQuery({
    queryKey: masterCodeKeys.activityCodesCatalogAll(),
    queryFn: () => {
      console.log("useGetMasterActivityCatalog queryFn executing! Fetching from API...");
      return apiFetchActivityCodesCatalogAll({ inactiveOnly: false });
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
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
    staleTime: 0,
    gcTime: 0,
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
