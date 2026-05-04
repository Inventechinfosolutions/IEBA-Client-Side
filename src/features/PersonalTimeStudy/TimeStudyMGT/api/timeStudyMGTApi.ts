import { apiGetUserModuleRows } from "@/features/user/api"
import { apiGetMonthLegend, apiGetDayDetail, apiGetUserProgramsAndActivities } from "../../api/personalTimeStudyApi"
import { api } from "@/lib/api"
import type { UserMonthLegendResDto, UserDayLegendDetailResDto } from "../../types"
import type { MgtEmployeeRow } from "../types"

/**
 * Fetch the employee list for the MGT tab.
 * @param search - Optional name search
 * @param departmentIds - Optional comma-separated department IDs
 */
export async function apiMgtGetEmployeeList(search?: string, departmentIds?: string): Promise<MgtEmployeeRow[]> {
  const res = await apiGetUserModuleRows({
    page: 1,
    pageSize: 100,
    sort: "ASC",
    inactiveOnly: false,
    name: search || undefined,
    departmentId: departmentIds,
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
 */
export async function apiMgtGetMonthLegend(
  userId: string,
  month: number,
  year: number
): Promise<UserMonthLegendResDto> {
  return await apiGetMonthLegend({ userId, month, year })
}

/**
 * Fetch the day detail for a given user.
 */
export async function apiMgtGetDayDetail(params: {
  userId: string
  date: string
  month: number
  year: number
}): Promise<UserDayLegendDetailResDto> {
  return await apiGetDayDetail(params)
}

/**
 * Fetch programs and activities for a given user.
 */
export async function apiMgtGetUserProgramsAndActivities(userId: string): Promise<any> {
  return await apiGetUserProgramsAndActivities(userId)
}

/**
 * Perform an action (like NOTIFY) on a user's time study record.
 */
export async function apiMgtActionUserTimeRecord(params: {
  userId: string
  startDate: string
  endDate: string
  status: string
}): Promise<void> {
  await api.post("/timestudyrecords/user/timeentry/record/action", params)
}
