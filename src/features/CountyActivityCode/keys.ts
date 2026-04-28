import { masterCodeKeys } from "@/features/master-code/keys"

export const countyActivityCodeKeys = {
  all: ["countyActivityCode"] as const,
  /** `GET /activities/:id` (+ department names) for edit modal */
  activityDetail: (id: string) =>
    [...countyActivityCodeKeys.all, "activity-detail", id] as const,
  lists: () => [...countyActivityCodeKeys.all, "list"] as const,
  list: (filters?: { search?: string; inactive?: boolean }) =>
    [...countyActivityCodeKeys.lists(), filters] as const,
  /** Prefix for all paginated `GET /activities` caches (any page/search/status). */
  pagedLists: () => [...countyActivityCodeKeys.all, "paged"] as const,
  /** Paginated `GET /activities` (search, status, page, pageSize, departmentIds). */
  pagedList: (params: {
    page: number
    pageSize: number
    search: string
    status: string
    departmentIds?: number[]
  }) => [...countyActivityCodeKeys.pagedLists(), params] as const,
  /** `GET /activities/top-level` — table / shared active-primary context (main grid). */
  topLevel: () => [...countyActivityCodeKeys.all, "top-level"] as const,
  /**
   * Sub add/edit only: all **active** rows from aggregated `GET /activities?status=active`,
   * filtered to primaries — wider parent list than `top-level` alone.
   */
  activePrimarySubPicker: () =>
    [...countyActivityCodeKeys.all, "active-primary-sub-picker"] as const,
  /** Master activity-code options for a code type (filtered from shared catalog cache). */
  masterCodeOptionsByType: (codeType: string) =>
    [...countyActivityCodeKeys.all, "master-code-options", codeType] as const,
  /**
   * Same cache entry as {@link masterCodeKeys.detail} — `GET /activity-codes/:id` for “Copy code” on add primary.
   */
  masterActivityCodeDetail: (id: string) => masterCodeKeys.detail(id),
}
