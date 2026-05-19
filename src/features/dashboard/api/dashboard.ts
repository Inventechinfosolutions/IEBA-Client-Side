import { api } from "@/lib/api"
import type {
  ApiEnvelope,
  DashboardOverview,
  ReportItem,
} from "../types"
import { PayrollPeriod } from "../enums/dashboard.enum"
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
  }
  const start = new Date(year, month, 16)
  const end = new Date(year, month + 1, 0)
  return { startDate: toIsoYmdFromDate(start), endDate: toIsoYmdFromDate(end) }
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

export async function getReportsByRole(_params?: {
  departmentId?: number
  roleId?: number
}): Promise<ReportItem[]> {
  try {
    const search = new URLSearchParams()
    search.set("status", "active")

    const res = await api.get<ApiEnvelope<ReportItem[]>>(`/report?${search.toString()}`)
    const payload = (res?.data ?? res) as ReportItem[] | { data?: ReportItem[] }
    const apiData = Array.isArray(payload) ? payload : (payload?.data ?? [])

    return apiData.map((r) => ({
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
      totalCostPoolCount: 0,
      totalJobPoolCount: 0,
      totalDepartmentCount: 0,
      totalTimeStudyProgramCount: 0,
      totalActivityCount: 0,
      totalActivityDepartmentCount: 0,
    }
  )
}
