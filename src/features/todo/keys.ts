export const todoKeys = {
  all: ["todo"] as const,
  lists: () => [...todoKeys.all, "list"] as const,
  list: (params: { page: number; pageSize: number }) => [...todoKeys.lists(), params] as const,
  details: () => [...todoKeys.all, "detail"] as const,
  detail: (id: string) => [...todoKeys.details(), id] as const,
}
