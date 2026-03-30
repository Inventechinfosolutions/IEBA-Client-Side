import { useQuery } from "@tanstack/react-query"

import { departmentRoleKeys } from "../keys"
import type { DepartmentRoleWithChildren } from "../types"

let mockDepartmentRolesStore: DepartmentRoleWithChildren[] = [
  {
    id: "1",
    departmentName: "Behavioral Health",
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
  {
    id: "2",
    departmentName: "Public Health",
    roles: [
      "Department Admin",
      "Payroll Admin",
      "Time Study Admin",
      "Time Study Supervisor",
      "User",
    ],
    status: "active",
    children: [
      { id: "2-1", roleName: "Department Admin", status: "active" },
      { id: "2-2", roleName: "Payroll Admin", status: "active" },
      { id: "2-3", roleName: "Time Study Admin", status: "active" },
      { id: "2-4", roleName: "Time Study Supervisor", status: "active" },
      { id: "2-5", roleName: "User", status: "active" },
    ],
  },
  {
    id: "3",
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
      { id: "3-1", roleName: "Department Admin", status: "active" },
      { id: "3-2", roleName: "Payroll Admin", status: "active" },
      { id: "3-3", roleName: "Time Study Admin", status: "active" },
      { id: "3-4", roleName: "Time Study Supervisor", status: "active" },
      { id: "3-5", roleName: "User", status: "active" },
    ],
  },
]

const LOADING_DELAY_MS = 500

export function getMockDepartmentRolesStore(): DepartmentRoleWithChildren[] {
  return mockDepartmentRolesStore
}

export function setMockDepartmentRolesStore(
  next: DepartmentRoleWithChildren[]
): void {
  mockDepartmentRolesStore = next
}

async function fetchDepartmentRoles(): Promise<DepartmentRoleWithChildren[]> {
  // Simulate network delay so skeleton loading is visible (remove when using real API)
  await new Promise((resolve) => setTimeout(resolve, LOADING_DELAY_MS))
  // Replace with real API when available, e.g.:
  // const res = await fetch("/api/department-roles")
  // if (!res.ok) throw new Error("Failed to fetch department roles")
  // return res.json()
  return getMockDepartmentRolesStore()
}

export function useGetDepartmentRoles() {
  return useQuery({
    queryKey: departmentRoleKeys.lists(),
    queryFn: fetchDepartmentRoles,
  })
}
