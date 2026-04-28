export const reportKeys = {
  all: ["reports"] as const,
  lists: () => [...reportKeys.all, "list"] as const,
  catalog: () => [...reportKeys.lists(), "catalog"] as const,
  maaEmployees: (types: string[], dept?: string) => [...reportKeys.all, "maa-employees", { types, dept }] as const,
  costPoolUsers: (pools: string[], user: string, status?: string[]) =>
    [...reportKeys.all, "cost-pool-users", { pools, user, status }] as const,
  maaTcmActivityDepartments: () => [...reportKeys.all, "maa-tcm-activity-departments"] as const,
  listAllPrograms: () => [...reportKeys.all, "list-all-programs"] as const,
}

