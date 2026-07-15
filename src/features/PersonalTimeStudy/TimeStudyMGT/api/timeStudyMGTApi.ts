import { apiGetMonthLegend, apiGetDayDetail, apiGetUserProgramsAndActivities } from "../../api/personalTimeStudyApi"
import { api } from "@/lib/api"
import type { UserMonthLegendResDto, UserDayLegendDetailResDto } from "../../types"
import type { MgtEmployeeRow } from "../types"

/**
 * Fetch the employee list for the MGT tab.
 * @param search - Optional name search
 * @param departmentIds - Optional comma-separated department IDs
 */
export async function apiMgtGetEmployeeList(_search?: string, _departmentIds?: string): Promise<MgtEmployeeRow[]> {
  const res = await api.get<any>(
   `/timestudyrecords/users/eligible-all?status=active`
  )
  const items = res.data?.data ?? []
  return items.map((u: any) => ({
    id: u.id,
    employee: u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.id,
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    name: u.name || `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
    department: "",
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
  return await apiGetMonthLegend({ userId, month, year, screen: "tsmanagement" })
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
  return await apiGetDayDetail({ ...params, screen: "tsmanagement" })
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

export type MgtActionDateRange = {
  startDate: string
  endDate: string
}

export async function apiMgtActionUserTimeRecordRanges(params: {
  userId: string
  dateRanges: MgtActionDateRange[]
  status: string
}): Promise<void> {
  await Promise.all(
    params.dateRanges.map(({ startDate, endDate }) =>
      apiMgtActionUserTimeRecord({
        userId: params.userId,
        startDate,
        endDate,
        status: params.status,
      }),
    ),
  )
}
