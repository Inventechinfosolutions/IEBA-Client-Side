import { api } from "@/lib/api"
import { getUsersTotalCountByStatus, getUsersTotalCountUnfiltered } from "@/features/user/api"
import type {
  ApiEnvelope,
  DashboardOverview,
  Holiday,
  JpCpTotals,
  LeaveAggregateResult,
  ReportItem,
  TimeStudyAggregateResult,
  TimeStudySuperAggregateResult,
  TodoItem,
  TodoListResult,
} from "../types"
import { PayrollPeriod, TimeStudyStatus, DashboardQueryType } from "../enums/dashboard.enum"



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




export async function getPersonalTimeStudy(params: {
  startDate: string
  endDate: string
  userId: string | number
  departmentId?: number
  roleId?: number
}): Promise<TimeStudyAggregateResult> {
  const body = {
    startDate: params.startDate,
    endDate: params.endDate,
    userId: params.userId,
    type: DashboardQueryType.Monthly,
    status: TimeStudyStatus.Submitted,
    departmentId: params.departmentId,
    roleId: params.roleId,
  }
  const res = await api.post<ApiEnvelope<{ statusCounts: TimeStudyAggregateResult["statusCounts"] }[]>>(
    "/timestudyrecords/user/timeentry/record",
    body,
  )
  const payload = (res?.data ?? res) as { statusCounts: TimeStudyAggregateResult["statusCounts"] }[]
  const first = Array.isArray(payload) ? payload[0] : payload
  return { statusCounts: first?.statusCounts ?? [] }
}


export async function getTimeRecordRequests(params: {
  startDate: string
  endDate: string
  userId: string | number
  departmentId?: number
  roleId?: number
}): Promise<TimeStudySuperAggregateResult> {
  const body = {
    startDate: params.startDate,
    endDate: params.endDate,
    userId: params.userId,
    type: DashboardQueryType.Super,
    status: TimeStudyStatus.Submitted,
    departmentId: params.departmentId,
    roleId: params.roleId,
  }
  const res = await api.post<ApiEnvelope<{ statusCounts: TimeStudySuperAggregateResult["statusCounts"] }[]>>(
    "/timestudyrecords/user/timeentry/record",
    body,
  )
  const payload = (res?.data ?? res) as { statusCounts: TimeStudySuperAggregateResult["statusCounts"] }[]
  const first = Array.isArray(payload) ? payload[0] : payload
  return { statusCounts: first?.statusCounts ?? [] }
}


export async function getLeaveDetails(userId: string | number): Promise<LeaveAggregateResult> {
  const res = await api.get<ApiEnvelope<{ statusCounts: LeaveAggregateResult["statusCounts"] }>>(
    `/usersleave?action=leaveDetails&userId=${userId}`,
  )
  const payload = (res?.data ?? res) as { statusCounts: LeaveAggregateResult["statusCounts"] }
  return { statusCounts: payload?.statusCounts ?? [] }
}


export async function getStaffLeave(): Promise<LeaveAggregateResult> {
  const res = await api.get<ApiEnvelope<{ statusCounts: LeaveAggregateResult["statusCounts"] }>>(
    "/usersleave?action=leaveDetails",
  )
  const payload = (res?.data ?? res) as { statusCounts: LeaveAggregateResult["statusCounts"] }
  return { statusCounts: payload?.statusCounts ?? [] }
}


export async function getTodos(userId: string | number): Promise<TodoListResult> {
  const search = new URLSearchParams()
  search.set("userId", String(userId))
  const res = await api.get<ApiEnvelope<{ data: TodoItem[] }>>(`/todos?${search.toString()}`)
  const payload = (res?.data ?? res) as { data: TodoItem[] }
  return { items: payload?.data ?? [] }
}


export async function getHolidays(year: number): Promise<Holiday[]> {
  const res = await api.get<ApiEnvelope<Holiday[]>>(
    `/setting/holiday/list?year=${year}`,
  )
  const payload = (res?.data ?? res) as Holiday[]
  return Array.isArray(payload) ? payload : []
}


/** Total users: GET /users with no `status` (pagination meta only). */
export async function getDashboardAllUsersCount(): Promise<number> {
  return getUsersTotalCountUnfiltered()
}

/** Active user count from GET /users?status=active (pagination meta), not /user/active-users. */
export async function getActiveUsers(): Promise<number> {
  return getUsersTotalCountByStatus("active")
}


export async function getDepartmentCount(): Promise<number> {
  const res = await api.get<ApiEnvelope<number>>(
    "/department?screen=dashboard",
  )
  const payload = (res?.data ?? res) as number
  return typeof payload === "number" ? payload : 0
}


export async function getProgramCount(): Promise<number> {
  const res = await api.get<ApiEnvelope<number>>(
    "/timestudyprogram?method=count",
  )
  const payload = (res?.data ?? res) as number
  return typeof payload === "number" ? payload : 0
}



export async function getJpCpTotals(): Promise<JpCpTotals | null> {
  try {
    const res = await api.get<ApiEnvelope<JpCpTotals>>("/costpool/jp-cp-totals")
    const payload = (res?.data ?? res) as JpCpTotals
    return payload ?? null
  } catch {
    return null
  }
}



export async function getReportsByRole(params?: {
  departmentId?: number
  roleId?: number
}): Promise<ReportItem[]> {
  try {
    const search = new URLSearchParams()
    if (params?.departmentId) search.set("departmentId", String(params.departmentId))
    if (params?.roleId) search.set("roleId", String(params.roleId))

    const res = await api.get<ApiEnvelope<ReportItem[]>>(`/report-role?${search.toString()}`)
    const payload = (res?.data ?? res) as ReportItem[]
    const apiData = Array.isArray(payload) ? payload : []


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

export async function getDashboardOverview(): Promise<DashboardOverview> {
  const res = await api.get<ApiEnvelope<DashboardOverview>>("/dashboard/overview")
  const payload = (res?.data ?? res) as DashboardOverview
  return (
    payload ?? {
      totalUserCount: 0,
      totalCostPoolCount: 0,
      totalJobPoolCount: 0,
      totalDepartmentCount: 0,
      totalTimeStudyProgramCount: 0,
      totalActivityCount: 0,
      totalActivityDepartmentCount: 0,
    }
  )
}
