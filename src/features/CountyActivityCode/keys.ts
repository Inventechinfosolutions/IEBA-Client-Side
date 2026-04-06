import { masterCodeKeys } from "@/features/master-code/keys"

export const countyActivityCodeKeys = {
  all: ["countyActivityCode"] as const,
  /** `GET /activities/:id` (+ department names) for edit modal */
  activityDetail: (id: string) =>
    [...countyActivityCodeKeys.all, "activity-detail", id] as const,
  lists: () => [...countyActivityCodeKeys.all, "list"] as const,
  list: (filters?: { search?: string; inactive?: boolean }) =>
    [...countyActivityCodeKeys.lists(), filters] as const,
  /**
   * Same cache entry as {@link masterCodeKeys.detail} — `GET /activity-codes/:id` for “Copy code” on add primary.
   */
  masterActivityCodeDetail: (id: string) => masterCodeKeys.detail(id),
}
