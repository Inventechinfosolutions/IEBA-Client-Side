import { api } from "@/lib/api"
import type {
  ApiEnvelope,
  ActiveUserResult,
  Holiday,
  JpCpTotals,
  LeaveAggregateResult,
  ReportItem,
  TimeStudyAggregateResult,
  TimeStudySuperAggregateResult,
  TodoListResult,
  UserCountResult,
} from "../types"
import { HolidayType, PayrollPeriod } from "../enums/dashboard.enum"



function getStartEndOfMonth(date = new Date()): { startDate: string; endDate: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function getStartEndOfWeek(date = new Date()): { startDate: string; endDate: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(d.setDate(diff))
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return {
    startDate: new Date(start).toISOString().slice(0, 10),
    endDate: new Date(end).toISOString().slice(0, 10),
  }
}

function getStartEndOfBiweek(date = new Date()): { startDate: string; endDate: string } {
  const { startDate } = getStartEndOfWeek(date)
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + 13)
  return { startDate, endDate: end.toISOString().slice(0, 10) }
}

function getStartEndSemimonthly(date = new Date()): { startDate: string; endDate: string } {
  const day = date.getDate()
  const year = date.getFullYear()
  const month = date.getMonth()
  if (day <= 15) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month, 15)
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
  } else {
    const start = new Date(year, month, 16)
    const end = new Date(year, month + 1, 0)
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) }
  }
}

export function getPayrollDateRange(
  payrollType: string,
): { startDate: string; endDate: string; label: string } {
  switch (payrollType) {
    case PayrollPeriod.Weekly: {
      const { startDate, endDate } = getStartEndOfWeek()
      return { startDate, endDate, label: "Weekly" }
    }
    case PayrollPeriod.Biweekly: {
      const { startDate, endDate } = getStartEndOfBiweek()
      return { startDate, endDate, label: "Bi-Weekly" }
    }
    case PayrollPeriod.Semimonthly: {
      const { startDate, endDate } = getStartEndSemimonthly()
      return { startDate, endDate, label: "Semi-Monthly" }
    }
    default: {
      const { startDate, endDate } = getStartEndOfMonth()
      const label = new Date().toLocaleString("default", { month: "long" })
      return { startDate, endDate, label }
    }
  }
}



/** GET /api/v1/timestudyrecord/filter — personal TS aggregate */
export async function getPersonalTimeStudy(params: {
  startDate: string
  endDate: string
  userId: string | number
}): Promise<TimeStudyAggregateResult> {
  const body = {
    startDate: params.startDate,
    endDate: params.endDate,
    userId: params.userId,
    type: "monthly",
    status: "submitted",
  }
  const res = await api.post<ApiEnvelope<{ statusCounts: TimeStudyAggregateResult["statusCounts"] }[]>>(
    "/timestudyrecord/filter",
    body,
  )
  const payload = (res?.data ?? res) as { statusCounts: TimeStudyAggregateResult["statusCounts"] }[]
  const first = Array.isArray(payload) ? payload[0] : payload
  return { statusCounts: first?.statusCounts ?? [] }
}

/** GET /api/v1/timestudyrecord/filter — admin aggregate (approval requests) */
export async function getTimeRecordRequests(params: {
  startDate: string
  endDate: string
  userId: string | number
}): Promise<TimeStudySuperAggregateResult> {
  const body = {
    startDate: params.startDate,
    endDate: params.endDate,
    userId: params.userId,
    type: "super",
    status: "submitted",
    usertype: "notuser",
  }
  const res = await api.post<ApiEnvelope<{ statusCounts: TimeStudySuperAggregateResult["statusCounts"] }[]>>(
    "/timestudyrecord/filter",
    body,
  )
  const payload = (res?.data ?? res) as { statusCounts: TimeStudySuperAggregateResult["statusCounts"] }[]
  const first = Array.isArray(payload) ? payload[0] : payload
  return { statusCounts: first?.statusCounts ?? [] }
}

/** GET /api/v1/leave — leave details for a user */
export async function getLeaveDetails(userId: string | number): Promise<LeaveAggregateResult> {
  const res = await api.get<ApiEnvelope<{ statusCounts: LeaveAggregateResult["statusCounts"] }>>(
    `/leave?action=leaveDetails&userId=${userId}`,
  )
  const payload = (res?.data ?? res) as { statusCounts: LeaveAggregateResult["statusCounts"] }
  return { statusCounts: payload?.statusCounts ?? [] }
}

/** GET /api/v1/leave — all staff leave */
export async function getStaffLeave(): Promise<LeaveAggregateResult> {
  const res = await api.get<ApiEnvelope<{ statusCounts: LeaveAggregateResult["statusCounts"] }>>(
    "/leave?action=leaveDetails",
  )
  const payload = (res?.data ?? res) as { statusCounts: LeaveAggregateResult["statusCounts"] }
  return { statusCounts: payload?.statusCounts ?? [] }
}

/** GET /api/v1/todo — todo items */
export async function getTodos(): Promise<TodoListResult> {
  const res = await api.get<ApiEnvelope<{ items: TodoListResult["items"] }>>(
    "/todo?action=leaveDetails",
  )
  const payload = (res?.data ?? res) as { items: TodoListResult["items"] }
  return { items: payload?.items ?? [] }
}

/** GET /api/v1/settings/holidays — holiday list */
export async function getHolidays(year: number): Promise<Holiday[]> {
  const res = await api.get<ApiEnvelope<Holiday[]>>(
    `/settings/holidays?type=${HolidayType.Yearly}&year=${year}`,
  )
  const payload = (res?.data ?? res) as Holiday[]
  return Array.isArray(payload) ? payload : []
}

/** GET /api/v1/user?screen=dashboard — user count */
export async function getUserCount(): Promise<number> {
  const res = await api.get<ApiEnvelope<UserCountResult | number>>(
    "/user?screen=dashboard",
  )
  const payload = (res?.data ?? res) as UserCountResult | number
  if (typeof payload === "number") return payload
  return (payload as UserCountResult)?.count ?? 0
}

/** GET /api/v1/user/active-users — active users */
export async function getActiveUsers(): Promise<number> {
  const res = await api.get<ApiEnvelope<ActiveUserResult>>(
    "/user/active-users",
  )
  const payload = (res?.data ?? res) as ActiveUserResult
  return payload?.userCount ?? 0
}

/** GET /api/v1/department?screen=dashboard — department count */
export async function getDepartmentCount(): Promise<number> {
  const res = await api.get<ApiEnvelope<number>>(
    "/department?screen=dashboard",
  )
  const payload = (res?.data ?? res) as number
  return typeof payload === "number" ? payload : 0
}

/** GET /api/v1/timestudyprogram/count — TSP count */
export async function getProgramCount(): Promise<number> {
  const res = await api.get<ApiEnvelope<number>>(
    "/timestudyprogram?method=count",
  )
  const payload = (res?.data ?? res) as number
  return typeof payload === "number" ? payload : 0
}

/** GET /api/v1/costpool/jp-cp-totals — job pool + cost pool totals */
export async function getJpCpTotals(): Promise<JpCpTotals | null> {
  try {
    const res = await api.get<ApiEnvelope<JpCpTotals>>("/costpool/jp-cp-totals")
    const payload = (res?.data ?? res) as JpCpTotals
    return payload ?? null
  } catch {
    return null
  }
}

/** GET /api/v1/report-role — reports by role */
export async function getReportsByRole(): Promise<ReportItem[]> {
  try {
    const res = await api.get<ApiEnvelope<ReportItem[]>>("/report-role")
    const payload = (res?.data ?? res) as ReportItem[]
    const apiData = Array.isArray(payload) ? payload : []
    
    // If API returns empty, or just to provide the requested dummy data
    const dummyReports: ReportItem[] = [
      { id: 1, code: "P100", name: "Employee Time Summation" },
      { id: 2, code: "P101", name: "Employee by Function Code" },
      { id: 3, code: "P110", name: "Time Study Daily" },
      { id: 4, code: "P111", name: "Daily - Start/Stop" },
      { id: 5, code: "P112", name: "Daily - Start/Stop/Travel" },
      { id: 6, code: "TSCR", name: "Time Study Calculation Report" },
      { id: 7, code: "AC741", name: "Disaster Services Time Tracking" },
      { id: 8, code: "TCM_MAA_ADHOC", name: "Report" },
      { id: 9, code: "MAATCM", name: "Timestudy MAA/TCM" },
      { id: 10, code: "DSSRPT2", name: "TIME STUDY HOURS BY EMPLOYEE" },
      { id: 11, code: "MCAH-TVTS", name: "MCAH - MONTHLY TITLE V TIME STUDY (..." },
      { id: 12, code: "WIC", name: "Time Study" },
    ]

    return apiData.length > 0 ? apiData : dummyReports
  } catch {
    return [
      { id: 1, code: "P100", name: "Employee Time Summation" },
      { id: 2, code: "P101", name: "Employee by Function Code" },
      { id: 3, code: "P110", name: "Time Study Daily" },
      { id: 4, code: "P111", name: "Daily - Start/Stop" },
      { id: 5, code: "P112", name: "Daily - Start/Stop/Travel" },
      { id: 6, code: "TSCR", name: "Time Study Calculation Report" },
      { id: 7, code: "AC741", name: "Disaster Services Time Tracking" },
      { id: 8, code: "TCM_MAA_ADHOC", name: "Report" },
      { id: 9, code: "MAATCM", name: "Timestudy MAA/TCM" },
      { id: 10, code: "DSSRPT2", name: "TIME STUDY HOURS BY EMPLOYEE" },
      { id: 11, code: "MCAH-TVTS", name: "MCAH - MONTHLY TITLE V TIME STUDY (..." },
      { id: 12, code: "WIC", name: "Time Study" },
    ]
  }
}
