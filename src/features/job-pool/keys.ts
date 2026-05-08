import type { GetJobPoolsParams } from "./types"

export const jobPoolKeys = {
  all: ["jobPool"] as const,
  lists: () => [...jobPoolKeys.all, "list"] as const,
  list: (params: GetJobPoolsParams) =>
    [...jobPoolKeys.lists(), params] as const,
  details: () => [...jobPoolKeys.all, "detail"] as const,
  detail: (id: string) => [...jobPoolKeys.details(), id] as const,
  /** `GET /jobpool/history` — paginated job pool history log. */
  history: (params: { page: number; limit: number; assignmentKind: string }) =>
    [...jobPoolKeys.all, "history", params] as const,
}
