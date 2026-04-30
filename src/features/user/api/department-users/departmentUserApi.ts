import { api } from "@/lib/api"
import type { DepartmentUser } from "@/features/payroll/types"

/**
 * Fetches users (employees) for a specific department.
 * GET /api/v1/departments?method=users&departmentId=<id>
 */
export async function fetchDepartmentUsers(departmentId: string): Promise<DepartmentUser[]> {
  if (!departmentId || departmentId === "all" || departmentId === "") return []
  const url = `/departments?method=users&departmentId=${departmentId}`
  const res = await api.get<{ data: { userDetails?: DepartmentUser[] } }>(url)
  return res?.data?.userDetails || []
}

export async function fetchDepartmentUserPicklist(departmentId: string): Promise<any> {
  if (!departmentId || departmentId === "all" || departmentId === "") return {}
  const url = `/departments?method=users&departmentId=${departmentId}`
  const res = await api.get<{ data: any }>(url)
  return res?.data || {}
}
