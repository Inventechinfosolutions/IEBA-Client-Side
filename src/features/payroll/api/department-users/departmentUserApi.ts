import { api } from "@/lib/api"
import type { DepartmentUser } from "../../types"

/**
 * Fetches users (employees) for a specific department.
 * GET /api/v1/departments?method=users&departmentId=<id>
 */
export async function fetchDepartmentUsers(departmentId: string): Promise<DepartmentUser[]> {
  if (!departmentId || departmentId === "all" || departmentId === "") return []

  const url = `/departments?method=users&departmentId=${departmentId}`
  const res = await api.get<{ data: { userDetails?: DepartmentUser[] } }>(url)

  // Extract the userDetails from the data wrapper
  const userList = res?.data?.userDetails || []
  
  return userList
}
