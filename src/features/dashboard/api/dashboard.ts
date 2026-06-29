import { api } from "@/lib/api"
import { getUsersTotalCountUnfiltered } from "@/features/user/api"
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
import { toIsoYmdFromDate } from "@/lib/dates"



function getStartEndOfMonth(date = new Date()): { startDate: string; endDate: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return {
    startDate: toIsoYmdFromDate(start),
    endDate: toIsoYmdFromDate(end),
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
    startDate: toIsoYmdFromDate(start),
    endDate: toIsoYmdFromDate(end),
  }
}

function getStartEndOfBiweek(date = new Date()): { startDate: string; endDate: string } {
  const { startDate } = getStartEndOfWeek(date)
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + 13)
  return { startDate, endDate: toIsoYmdFromDate(end) }
}

function getStartEndSemimonthly(date = new Date()): { startDate: string; endDate: string } {
  const day = date.getDate()
  const year = date.getFullYear()
  const month = date.getMonth()
  if (day <= 15) {
    const start = new Date(year, month, 1)
    const end = new Date(year, month, 15)
    return { startDate: toIsoYmdFromDate(start), endDate: toIsoYmdFromDate(end) }
  } else {
    const start = new Date(year, month, 16)
    const end = new Date(year, month + 1, 0)
    return { startDate: toIsoYmdFromDate(start), endDate: toIsoYmdFromDate(end) }
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


export async function getLeaveDetails(
  filterUserId?: string | number,
  leaveType?: "personal" | "staff"
): Promise<LeaveAggregateResult> {
  const search = new URLSearchParams({ action: "leaveDetails" })
  if (filterUserId) search.set("filterUserId", String(filterUserId))
  if (leaveType) search.set("leaveType", leaveType)
  const res = await api.get<ApiEnvelope<{ statusCounts: LeaveAggregateResult["statusCounts"] }>>(
    `/usersleave?${search.toString()}`,
  )
  const payload = (res?.data ?? res) as { statusCounts: LeaveAggregateResult["statusCounts"] }
  return { statusCounts: payload?.statusCounts ?? [] }
}


export async function getStaffLeave(userId?: string | number): Promise<LeaveAggregateResult> {
  const search = new URLSearchParams({ action: "leaveDetails", leaveType: "staff" })
  if (userId) search.set("userId", String(userId))
  const res = await api.get<ApiEnvelope<{ statusCounts: LeaveAggregateResult["statusCounts"] }>>(
    `/usersleave?${search.toString()}`,
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

/** Logged-in sessions for current tenant (Redis ZSET; expired pruned via ZREMRANGEBYSCORE on server). */
export async function getActiveUsers(): Promise<number> {
  const res = await api.get<ApiEnvelope<{ count: number }>>("/auth/active-sessions")
  const payload = (res?.data ?? res) as { count?: number }
  return typeof payload?.count === "number" ? payload.count : 0
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
  isSuperAdmin?: boolean
  departmentIds?: number[]
}): Promise<ReportItem[]> {
  try {
    if (params?.isSuperAdmin) {
      const search = new URLSearchParams()
      search.set("status", "active")
      const res = await api.get<ApiEnvelope<ReportItem[]>>(`/report?${search.toString()}`)
      const payload = (res?.data ?? res) as any
      const apiData = Array.isArray(payload) ? payload : (payload?.data ?? [])

      return apiData.map((r: any) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        filename: r.filename,
        path: r.path,
        criteria: r.criteria,
      }))
    }

    const deptIds = params?.departmentIds && params.departmentIds.length > 0
      ? params.departmentIds
      : params?.departmentId
        ? [params.departmentId]
        : []

    const uniqueDeptIds = Array.from(new Set(deptIds))

    if (uniqueDeptIds.length === 0) {
      return []
    }

    const res = await api.get<ApiEnvelope<any[]>>(`/dashboard/department/${uniqueDeptIds.join(",")}/reports`)
    const payload = (res?.data ?? res) as any
    const apiData = Array.isArray(payload) ? payload : (payload?.data ?? [])

    const uniqueReportsMap = new Map<number, any>()
    for (const dept of apiData) {
      if (Array.isArray(dept.reports)) {
        for (const report of dept.reports) {
          if (report.status === "active") {
            uniqueReportsMap.set(report.id, report)
          }
        }
      }
    }

    const matchedReports = Array.from(uniqueReportsMap.values())
    return matchedReports.map((r: any) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      filename: r.filename,
      path: r.path,
      criteria: r.criteria,
    }))
  } catch (error) {
    console.error("Failed to fetch reports:", error)
    return []
  }
}

export async function getDashboardOverview(params?: {
  userId?: string | number
  departmentId?: number
  roleId?: number
}): Promise<DashboardOverview> {
  const search = new URLSearchParams()
  if (params?.userId) search.set("userId", String(params.userId))
  if (params?.departmentId) search.set("departmentId", String(params.departmentId))
  if (params?.roleId) search.set("roleId", String(params.roleId))
  const url = search.toString() ? `/dashboard/overview?${search.toString()}` : "/dashboard/overview"
  const res = await api.get<ApiEnvelope<DashboardOverview>>(url)
  const payload = (res?.data ?? res) as DashboardOverview
  return (
    payload ?? {
      totalUserCount: 0,
      totalActiveUserCount: 0,
      totalCostPoolCount: 0,
      totalJobPoolCount: 0,
      totalDepartmentCount: 0,
      totalTimeStudyProgramCount: 0,
      totalActivityCount: 0,
      totalActivityDepartmentCount: 0,
    }
  )
}

export interface DashboardStatusUsersParams {
  status: "approved" | "submitted" | "draft"
  userId?: string | number
  month?: string
  year?: string
  quarter?: string
  page?: number
  limit?: number
  order?: "ASC" | "DESC" | "asc" | "desc"
  search?: string
}

export interface DashboardStatusUsersListRes {
  data: {
    id: string | number
    name: string
    department: string
    date?: string
  }[]
  meta: {
    itemCount: number
    totalItems: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export async function getDashboardStatusUsers(
  params: DashboardStatusUsersParams,
): Promise<DashboardStatusUsersListRes> {
  const search = new URLSearchParams()
  search.set("status", params.status)
  if (params.userId !== undefined) search.set("userId", String(params.userId))
  if (params.month) search.set("month", params.month)
  if (params.year) search.set("year", params.year)
  if (params.quarter) search.set("quarter", params.quarter)
  if (params.page !== undefined) search.set("page", String(params.page))
  if (params.limit !== undefined) search.set("limit", String(params.limit))
  if (params.order) search.set("order", params.order)
  if (params.search) search.set("search", params.search)

  const res = await api.get<ApiEnvelope<DashboardStatusUsersListRes>>(
    `/dashboard/status-users?${search.toString()}`,
  )
  const payload = (res?.data ?? res) as DashboardStatusUsersListRes
  return payload
}

export interface DashboardTimeStudyRecordsParams {
  userId: string | number
  status: "approved" | "submitted" | "draft"
  page?: number
  limit?: number
  order?: "ASC" | "DESC" | "asc" | "desc"
}

export interface DashboardTimeStudyRecordRow {
  id: number
  programid: string
  programcode?: string
  programname?: string
  activityid: string
  activitycode?: string
  activityname?: string
  starttime?: string
  endtime?: string
  activitytime: number
  comments?: string
  description?: string
  notes?: string
  leave?: string
  leaveid?: number
  recordType?: string
  parentId?: number
  date: string
  program?: { name: string; code: string }
  activity?: { name: string; code: string }
  supportingDocs?: Array<{ id?: number; fileName: string; url?: string }>
}

export interface DashboardTimeStudyRecordsRes {
  data: DashboardTimeStudyRecordRow[]
  meta: {
    itemCount: number
    totalItems: number
    itemsPerPage: number
    totalPages: number
    currentPage: number
  }
}

export async function getDashboardTimeStudyRecords(
  params: DashboardTimeStudyRecordsParams,
): Promise<DashboardTimeStudyRecordsRes> {
  const search = new URLSearchParams()
  search.set("userId", String(params.userId))
  search.set("status", params.status)
  if (params.page !== undefined) search.set("page", String(params.page))
  if (params.limit !== undefined) search.set("limit", String(params.limit))
  if (params.order) search.set("order", params.order)

  const res = await api.get<ApiEnvelope<DashboardTimeStudyRecordsRes>>(
    `/dashboard/time-study-records?${search.toString()}`,
  )
  const payload = (res?.data ?? res) as DashboardTimeStudyRecordsRes
  return payload
}


