import { apiGetUserModuleRows } from "@/features/user/api"
import { apiGetMonthLegend } from "../../api/personalTimeStudyApi"
import { api } from "@/lib/api"
import type { UserMonthLegendResDto } from "../../types"
import type { MgtEmployeeRow } from "../types"

/**
 * Fetch the employee list for the MGT tab.
 * Uses the existing /users endpoint with optional name search.
 */
export async function apiMgtGetEmployeeList(search?: string, departmentId?: string): Promise<MgtEmployeeRow[]> {
  const res = await apiGetUserModuleRows({
    page: 1,
    pageSize: 100,
    sort: "ASC",
    inactiveOnly: false,
    name: search || undefined,
    departmentId: departmentId,
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
 * Fetch the month legend for a given user.
 * Reuses the PersonalTimeStudy month-legend endpoint.
 */
export async function apiMgtGetMonthLegend(
  userId: string,
  month: number,
  year: number
): Promise<UserMonthLegendResDto> {
  return await apiGetMonthLegend({ userId, month, year })
}

/**
 * Perform an action (like NOTIFY) on a user's time study record for a date range.
 */
export async function apiMgtActionUserTimeRecord(params: {
  userId: string
  startDate: string
  endDate: string
  status: string
}): Promise<void> {
  await api.post("/timestudyrecords/user/timeentry/record/action", params)
}
