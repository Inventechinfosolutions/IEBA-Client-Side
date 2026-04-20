import { useQuery } from "@tanstack/react-query"
import { dashboardKeys } from "../keys"
import {
  getActiveUsers,
  getHolidays,
  getLeaveDetails,
  getPayrollDateRange,
  getPersonalTimeStudy,
  getReportsByRole,
  getStaffLeave,
  getTimeRecordRequests,
  getTodos,
  getDashboardOverview,
  getDashboardAllUsersCount,
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

const STALE_TIME = 0
const GC_TIME = 300_000 // 5 minutes


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


export function useSelfLeave() {
  return useQuery({
    queryKey: [...dashboardKeys.leaveDetails("self")],
    queryFn: () => getLeaveDetails(),
    select(data: LeaveAggregateResult): SelfLeaveStats {
      let requested = 0
      let approved = 0
      let rejected = 0
      let total = 0
      
      console.log('Self Leave Raw Data:', data)
      
      for (const s of data.statusCounts) {
        const status = (s as any).status || s.q_status
        const count = Number(s.count)
        total += count
        
        console.log('Processing self leave status:', status, 'count:', count)
        
        if (status === LeaveStatus.Requested || status === 'requested') {
          requested = count
        } else if (
          status === LeaveStatus.Approved ||
          status === 'approved' ||
          status === LeaveStatus.LeaveApproved
        ) {
          approved = count
        } else if (status === LeaveStatus.Rejected || status === 'rejected') {
          rejected = count
        }
      }
      
      console.log('Self Leave Result:', { requested, approved, rejected, total })
      return { requested, approved, rejected, total }
    },
    ...staleOptions,
  })
}


export function useStaffLeave(options?: { 
  userId?: string | number
  enabled?: boolean 
}) {
  return useQuery({
    queryKey: [...dashboardKeys.staffLeave(), { userId: options?.userId }],
    queryFn: () => getStaffLeave(options?.userId),
    select(data: LeaveAggregateResult): StaffLeaveStats {
      let requested = 0
      let approved = 0
      let rejected = 0
      
      console.log('Staff Leave Raw Data:', data)
      
      for (const s of data.statusCounts) {
        const status = (s as any).status || s.q_status
        const count = Number(s.count)
        
        console.log('Processing status:', status, 'count:', count)
        
        if (status === LeaveStatus.Requested || status === 'requested') {
          requested = count
        } else if (status === LeaveStatus.Approved || status === 'approved' || status === LeaveStatus.LeaveApproved) {
          approved = count
        } else if (status === LeaveStatus.Rejected || status === 'rejected') {
          rejected = count
        }
      }
      
      console.log('Staff Leave Result:', { requested, approved, rejected })
      return { requested, approved, rejected }
    },
    enabled: options?.enabled,
    ...staleOptions,
  })
}


export function useTodos(userId: string | number) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    day: "2-digit",
    month: "long",
  })

  const formatTodoDate = (item: TodoItem) => {
    const preferredDate =
      item.updatedAt ?? item.completedAt ?? item.completedDate ?? item.createdAt
    const parsed = Date.parse(preferredDate)
    if (!Number.isNaN(parsed)) {
      return formatter.format(parsed)
    }

    const createdParsed = Date.parse(item.createdAt)
    return Number.isNaN(createdParsed) ? "" : formatter.format(createdParsed)
  }

  return useQuery({
    queryKey: dashboardKeys.todos(userId),
    queryFn: () => getTodos(userId),
    select(data): TodoItem[] {
      return (data.items ?? []).map((item) => ({
        ...item,
        key: item.id,
        day: formatTodoDate(item),
      }))
    },
    enabled: !!userId,
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

export function useDashboardOverview(options?: { 
  userId?: string | number
  departmentId?: number
  roleId?: number
  enabled?: boolean 
}) {
  return useQuery<DashboardOverview>({
    queryKey: [...dashboardKeys.overview(), { userId: options?.userId, departmentId: options?.departmentId, roleId: options?.roleId }],
    queryFn: () => getDashboardOverview({ userId: options?.userId, departmentId: options?.departmentId, roleId: options?.roleId }),
    enabled: options?.enabled,
    ...staleOptions,
  })
}

export function useActiveUsers(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dashboardKeys.activeUsers(),
    queryFn: getActiveUsers,
    enabled: options?.enabled,
    ...staleOptions,
  })
}

export function useDashboardUserCount(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: dashboardKeys.userCount(),
    queryFn: getDashboardAllUsersCount,
    enabled: options?.enabled,
    ...staleOptions,
  })
}
