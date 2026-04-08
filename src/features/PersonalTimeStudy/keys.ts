export const personalTimeStudyKeys = {
  all: ["personalTimeStudy"] as const,
  lists: () => [...personalTimeStudyKeys.all, "list"] as const,
  list: (filters?: { search?: string }) =>
    [...personalTimeStudyKeys.lists(), filters] as const,
  /** Placeholder — align with future `GET .../:id` for edit flows. */
  detail: (id: string) =>
    [...personalTimeStudyKeys.all, "detail", id] as const,
  /** Placeholder — align with future master-code lookups if needed. */
  masterCodes: () => [...personalTimeStudyKeys.all, "master-codes"] as const,
}
