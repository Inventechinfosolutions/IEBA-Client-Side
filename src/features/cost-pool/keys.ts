export const costPoolKeys = {
  all: ["costPool"] as const,
  lists: () => [...costPoolKeys.all, "list"] as const,
  list: (filters?: { search?: string; inactive?: boolean }) =>
    [...costPoolKeys.lists(), filters] as const,
}
