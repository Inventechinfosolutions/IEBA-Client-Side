export const departmentRoleKeys = {
  all: ["departmentRole"] as const,
  lists: () => [...departmentRoleKeys.all, "list"] as const,
  list: (filters?: { page?: number; pageSize?: number }) =>
    [...departmentRoleKeys.lists(), filters] as const,
  details: () => [...departmentRoleKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentRoleKeys.details(), id] as const,
}
