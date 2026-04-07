import type { DepartmentFilter } from "./types"

export const departmentKeys = {
  all: ["departments"] as const,
  lists: () => [...departmentKeys.all, "list"] as const,
  list: (filter: DepartmentFilter) =>
    [...departmentKeys.lists(), filter] as const,
  details: () => [...departmentKeys.all, "detail"] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  /** Active users for contact dropdowns (paginated API). */
  contactUsers: () => [...departmentKeys.all, "contact-users"] as const,
}
