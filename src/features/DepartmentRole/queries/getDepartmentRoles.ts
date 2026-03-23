import { useQuery } from "@tanstack/react-query"

import { departmentRoleKeys } from "../keys"
import type { DepartmentRoleWithChildren } from "../types"

const MOCK_DEPARTMENT_ROLES: DepartmentRoleWithChildren[] = [
  {
    id: "1",
    departmentName: "Social Services",
    roles: [
      "Department Admin",
      "Payroll Admin",
      "Time Study Admin",
      "Time Study Supervisor",
      "User",
    ],
    status: "active",
    children: [
      { id: "1-1", roleName: "Department Admin", status: "active" },
      { id: "1-2", roleName: "Payroll Admin", status: "active" },
      { id: "1-3", roleName: "Time Study Admin", status: "active" },
      { id: "1-4", roleName: "Time Study Supervisor", status: "active" },
      { id: "1-5", roleName: "User", status: "active" },
    ],
  },
]

const LOADING_DELAY_MS = 500

async function fetchDepartmentRoles(): Promise<DepartmentRoleWithChildren[]> {
  // Simulate network delay so skeleton loading is visible (remove when using real API)
  await new Promise((resolve) => setTimeout(resolve, LOADING_DELAY_MS))
  // Replace with real API when available, e.g.:
  // const res = await fetch("/api/department-roles")
  // if (!res.ok) throw new Error("Failed to fetch department roles")
  // return res.json()
  return MOCK_DEPARTMENT_ROLES
}

export function useGetDepartmentRoles() {
  return useQuery({
    queryKey: departmentRoleKeys.lists(),
    queryFn: fetchDepartmentRoles,
  })
}
