import type { GetProgramsParams } from "./types"

export const programKeys = {
  all: ["program"] as const,
  lists: () => [...programKeys.all, "list"] as const,
  list: (params: GetProgramsParams) => [...programKeys.lists(), params] as const,
  details: () => [...programKeys.all, "detail"] as const,
  detail: (id: string) => [...programKeys.details(), id] as const,
}
