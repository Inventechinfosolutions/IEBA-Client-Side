import type { CostPoolListQueryParams } from "./types"

export const costPoolKeys = {
  all: ["costPool"] as const,
  lists: () => [...costPoolKeys.all, "list"] as const,
  list: (params: CostPoolListQueryParams) => [...costPoolKeys.lists(), params] as const,
  details: () => [...costPoolKeys.all, "detail"] as const,
  detail: (id: number) => [...costPoolKeys.details(), id] as const,
  activityPicklist: (departmentId: number) =>
    [...costPoolKeys.all, "activityPicklist", departmentId] as const,
}
