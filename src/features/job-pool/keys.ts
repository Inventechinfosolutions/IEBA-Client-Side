import type { GetJobPoolsParams } from "./types"

export const jobPoolKeys = {
  all: ["jobPool"] as const,
  lists: () => [...jobPoolKeys.all, "list"] as const,
  list: (params: GetJobPoolsParams) =>
    [...jobPoolKeys.lists(), params] as const,
  details: () => [...jobPoolKeys.all, "detail"] as const,
  detail: (id: string) => [...jobPoolKeys.details(), id] as const,
}
