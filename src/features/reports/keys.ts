export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  catalog: () => [...reportKeys.lists(), "catalog"] as const,
}
