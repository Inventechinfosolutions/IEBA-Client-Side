import { useQuery } from "@tanstack/react-query"
import { dashboardKeys } from "../keys"
import {
  getHolidays,
  getLeaveDetails,
  getPayrollDateRange,
  getPersonalTimeStudy,
  getReportsByRole,
  getStaffLeave,
  getTimeRecordRequests,
  getTodos,
  getDashboardOverview,
} from "../api/dashboard"
import type {
  DashboardOverview,
  Holiday,
  LeaveAggregateResult,
  ReportItem,
  SelfLeaveStats,
  StaffLeaveStats,
  TimeStudySuperAggregateResult,
  TodoItem,
} from "../types"
import { LeaveStatus, TimeStudyStatus } from "../enums/dashboard.enum"

const STALE_TIME = 60_000
const GC_TIME = STALE_TIME * 2


const staleOptions = {
  staleTime: STALE_TIME,
  gcTime: GC_TIME,
  refetchOnMount: true as const,
  refetchOnWindowFocus: false as const,
  retry: false as const,
}


export function usePersonalTimeStudy(params: {
  userId: string | number
  payrollType: string
  reqMins: number
  departmentId?: number
  roleId?: number
  enabled?: boolean
}) {
  const { startDate, endDate } = getPayrollDateRange(params.payrollType)

  return useQuery({
    queryKey: [...dashboardKeys.personalTimeStudy(), { startDate, endDate, userId: params.userId, departmentId: params.departmentId, roleId: params.roleId }],
    queryFn: () => getPersonalTimeStudy({ startDate, endDate, userId: params.userId, departmentId: params.departmentId, roleId: params.roleId }),
    select(data) {
      let approved = 0
      let submitted = 0
      for (const s of data.statusCounts) {
        if (s.status === TimeStudyStatus.Approved) approved = s.totalActivityTime
        if (s.status === TimeStudyStatus.Submitted) submitted = s.totalActivityTime
      }
      return { approved, submitted }
    },
    enabled: (params.enabled !== false) && !!params.userId,
    ...staleOptions,
  })
}


export function useTimeRecordRequests(params: {
  userId: string | number
  payrollType: string
  departmentId?: number
  roleId?: number
  enabled?: boolean
}) {
  const { startDate, endDate } = getPayrollDateRange(params.payrollType)

  return useQuery({
    queryKey: [...dashboardKeys.timeRecordRequests(), { startDate, endDate, userId: params.userId, departmentId: params.departmentId, roleId: params.roleId }],
    queryFn: () => getTimeRecordRequests({ startDate, endDate, userId: params.userId, departmentId: params.departmentId, roleId: params.roleId }),
    select(data: TimeStudySuperAggregateResult) {
      let approved = 0
      let pendingApproval = 0
      let notSubmitted = 0
      for (const s of data.statusCounts) {
        if (s.q_status === TimeStudyStatus.Approved) approved = s.count
        else if (s.q_status === TimeStudyStatus.Submitted) pendingApproval = s.count
        else notSubmitted = s.count
      }
      return { approved, pendingApproval, notSubmitted }
    },
    enabled: (params.enabled !== false) && !!params.userId,
    ...staleOptions,
  })
}


export function useSelfLeave(userId: string | number) {
  return useQuery({
    queryKey: dashboardKeys.leaveDetails(userId),
    queryFn: () => getLeaveDetails(userId),
    select(data: LeaveAggregateResult): SelfLeaveStats {
      let requested = 0
      let approved = 0
      let rejected = 0
      let total = 0
      for (const s of data.statusCounts) {
        const count = Number(s.count)
        total += count
        if (s.q_status === LeaveStatus.Requested) {
          requested = count
        } else if (
          s.q_status === LeaveStatus.Approved ||
          s.q_status === LeaveStatus.LeaveApproved
        ) {
          approved = count
        } else if (s.q_status === LeaveStatus.Rejected) {
          rejected = count
        }
      }
      return { requested, approved, rejected, total }
    },
    enabled: !!userId,
    ...staleOptions,
  })
}


export function useStaffLeave(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dashboardKeys.staffLeave(),
    queryFn: getStaffLeave,
    select(data: LeaveAggregateResult): StaffLeaveStats {
      let requested = 0
      let approved = 0
      let rejected = 0
      for (const s of data.statusCounts) {
        const status = (s as any).status || s.q_status
        if (status === LeaveStatus.Requested) requested = Number(s.count)
        else if (status === LeaveStatus.Approved || status === LeaveStatus.LeaveApproved)
          approved = Number(s.count)
        else if (status === LeaveStatus.Rejected) rejected = Number(s.count)
      }
      return { requested, approved, rejected }
    },
    enabled: options?.enabled,
    ...staleOptions,
  })
}


export function useTodos() {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    day: "2-digit",
    month: "long",
  })

  return useQuery({
    queryKey: dashboardKeys.todos(),
    queryFn: getTodos,
    select(data): TodoItem[] {
      return (data.items ?? []).map((item) => ({
        ...item,
        key: item.id,
        day: formatter.format(Date.parse(item.createdAt)),
      }))
    },
    ...staleOptions,
  })
}

export function useHolidays(options?: { enabled?: boolean }) {
  const year = new Date().getFullYear()

  return useQuery({
    queryKey: dashboardKeys.holidays(year),
    queryFn: () => getHolidays(year),
    select(data: Holiday[]) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // Normalize and parse dates safely
      const parseDate = (dStr: string) => {
        const t = dStr.trim()
        // Try YYYY-MM-DD
        let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(t)
        if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
        // Try MM-DD-YYYY
        m = /^(\d{2})-(\d{2})-(\d{4})/.exec(t)
        if (m) return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]))
        return new Date(t)
      }

      const sorted = [...data].sort((a, b) => {
        const da = parseDate(a.date).getTime()
        const db = parseDate(b.date).getTime()
        return da - db
      })

      const upcoming = sorted.filter((h) => {
        const d = parseDate(h.date)
        return d.getTime() >= today.getTime()
      })

      let nextMonth = ""
      let nextDay = "0"
      if (upcoming.length > 0) {
        const nextDate = parseDate(upcoming[0].date)
        nextMonth = nextDate.toLocaleString("en-US", { month: "long" })
        nextDay = nextDate.getDate().toString()
      }

      return { list: sorted, nextMonth, nextDay }
    },
    enabled: options?.enabled !== false,
    ...staleOptions,
  })
}


export function useReportsByRole(params?: {
  departmentId?: number
  roleId?: number
  enabled?: boolean
}) {
  return useQuery({
    queryKey: [...dashboardKeys.reports(), params],
    queryFn: () => getReportsByRole(params),
    select(data: ReportItem[]) {
      return data
    },
    enabled: params?.enabled !== false,
    ...staleOptions,
  })
}

export function useDashboardOverview(options?: { enabled?: boolean }) {
  return useQuery<DashboardOverview>({
    queryKey: dashboardKeys.overview(),
    queryFn: getDashboardOverview,
    enabled: options?.enabled,
    ...staleOptions,
  })
}
