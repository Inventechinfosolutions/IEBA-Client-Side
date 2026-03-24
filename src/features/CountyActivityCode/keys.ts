export const countyActivityCodeKeys = {
  all: ["countyActivityCode"] as const,
  lists: () => [...countyActivityCodeKeys.all, "list"] as const,
  list: (filters?: { search?: string; inactive?: boolean }) =>
    [...countyActivityCodeKeys.lists(), filters] as const,
}
