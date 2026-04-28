import { apiGetUserModuleRows } from "@/features/user/api"
import { apiGetMonthLegend } from "../../api/personalTimeStudyApi"
import type { MgtEmployeeRow, MgtDayStatusMap } from "../types"

/**
 * Fetch the employee list for the MGT tab.
 * Uses the existing /users endpoint with optional name search.
 */
export async function apiMgtGetEmployeeList(search?: string): Promise<MgtEmployeeRow[]> {
  const res = await apiGetUserModuleRows({
    page: 1,
    pageSize: 100,
    sort: "ASC",
    inactiveOnly: false,
    name: search || undefined,
  })
  return res.items.map((u) => ({
    id: u.id,
    employee: u.employee,
    firstName: u.firstName,
    lastName: u.lastName,
    department: u.department,
  }))
}

/**
 * Fetch the month legend for a given user → returns a day-status map.
 * Reuses the PersonalTimeStudy month-legend endpoint.
 */
export async function apiMgtGetMonthLegend(
  userId: string,
  month: number,
  year: number
): Promise<MgtDayStatusMap> {
  const res = await apiGetMonthLegend({ userId, month, year })
  return (res.data ?? []).reduce((acc, d) => {
    acc[d.date] = { status: d.status, color: d.color ?? undefined }
    return acc
  }, {} as MgtDayStatusMap)
}
