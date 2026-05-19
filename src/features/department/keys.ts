import type { DepartmentFilter } from "./types"

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (filter: DepartmentFilter) =>
    [...departmentKeys.lists(), filter] as const,
  /** GET /departments/all (no pagination). */
  allUnpaginated: (params: { status?: string; sort?: string; search?: string }) =>
    [...departmentKeys.all, "all-unpaginated", params] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  /** Active users for contact dropdowns (paginated API). */
  contactUsers: () => ["department-contact-users"] as const,
}
