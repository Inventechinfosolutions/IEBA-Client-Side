import type { GetJobClassificationsParams } from "./types"

export const jobClassificationKeys = {
  all: ["jobClassification"] as const,
  lists: () => [...jobClassificationKeys.all, "list"] as const,
  list: (params: GetJobClassificationsParams) =>
    [...jobClassificationKeys.lists(), params] as const,
  details: () => [...jobClassificationKeys.all, "detail"] as const,
  detail: (id: string) => [...jobClassificationKeys.details(), id] as const,
}
