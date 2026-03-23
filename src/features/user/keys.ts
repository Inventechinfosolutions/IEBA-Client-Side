export const userModuleKeys = {
  all: ["user-module"] as const,
  lists: () => [...userModuleKeys.all, "list"] as const,
  list: (params: {
    page: number
    pageSize: number
    inactiveOnly: boolean
  }) => [...userModuleKeys.lists(), params] as const,
  details: () => [...userModuleKeys.all, "detail"] as const,
  detail: (id: string) => [...userModuleKeys.details(), id] as const,
}
