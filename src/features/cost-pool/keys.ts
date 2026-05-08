import type { CostPoolListQueryParams } from "./types"

export const costPoolKeys = {
  all: ["costPool"] as const,
  lists: () => [...costPoolKeys.all, "list"] as const,
  list: (params: CostPoolListQueryParams) => [...costPoolKeys.lists(), params] as const,
  details: () => [...costPoolKeys.all, "detail"] as const,
  detail: (id: number) => [...costPoolKeys.details(), id] as const,
  activityPicklist: (departmentId: number) =>
    [...costPoolKeys.all, "activityPicklist", departmentId] as const,
  /** `GET /costpool/history` — paginated cost pool history log. */
  history: (params: { page: number; limit: number; activityCode: string; assignmentKind: string }) =>
    [...costPoolKeys.all, "history", params] as const,
}
