import { useQuery } from "@tanstack/react-query"
import { dashboardKeys } from "../keys"
import {
  getActiveUsers,
  getDepartmentCount,
  getHolidays,
  getJpCpTotals,
  getLeaveDetails,
  getPayrollDateRange,
  getPersonalTimeStudy,
  getProgramCount,
  getReportsByRole,
  getStaffLeave,
  getTimeRecordRequests,
  getTodos,
  getUserCount,
} from "../api/dashboard"
import type {
  Holiday,
  JpCpTotals,
  LeaveAggregateResult,
  ReportItem,
  SelfLeaveStats,
  StaffLeaveStats,
  TimeStudySuperAggregateResult,
  TodoItem,
} from "../types"
import { LeaveStatus, TimeStudyStatus } from "../enums/dashboard.enum"

const STALE_TIME = 60_000 // 1 min
const GC_TIME = STALE_TIME * 2


const staleOptions = {
  staleTime: STALE_TIME,
  gcTime: GC_TIME,
  refetchOnMount: true as const,
  refetchOnWindowFocus: false as const,
  retry: false as const, // Fail fast to reduce skeleton timing
}


export function usePersonalTimeStudy(params: {
  userId: string | number
  payrollType: string
  reqMins: number
}) {
  const { startDate, endDate } = getPayrollDateRange(params.payrollType)

  return useQuery({
    queryKey: [...dashboardKeys.personalTimeStudy(), { startDate, endDate, userId: params.userId }],
    queryFn: () => getPersonalTimeStudy({ startDate, endDate, userId: params.userId }),
    select(data) {
      let approved = 0
      let submitted = 0
      for (const s of data.statusCounts) {
        if (s.status === TimeStudyStatus.Approved) approved = s.totalActivityTime
        if (s.status === TimeStudyStatus.Submitted) submitted = s.totalActivityTime
      }
      return { approved, submitted }
    },
    enabled: !!params.userId,
    ...staleOptions,
  })
}


export function useTimeRecordRequests(params: {
  userId: string | number
  payrollType: string
}) {
  const { startDate, endDate } = getPayrollDateRange(params.payrollType)

  return useQuery({
    queryKey: [...dashboardKeys.timeRecordRequests(), { startDate, endDate }],
    queryFn: () => getTimeRecordRequests({ startDate, endDate, userId: params.userId }),
    select(data: TimeStudySuperAggregateResult) {
      let approved = 0
      let pendingApproval = 0
      let notSubmitted = 0
      for (const s of data.statusCounts) {
        if (s.q_status === "approved") approved = s.count
        else if (s.q_status === "submitted") pendingApproval = s.count
        else notSubmitted = s.count
      }
      return { approved, pendingApproval, notSubmitted }
    },
    enabled: !!params.userId,
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


export function useStaffLeave() {
  return useQuery({
    queryKey: dashboardKeys.staffLeave(),
    queryFn: getStaffLeave,
    select(data: LeaveAggregateResult): StaffLeaveStats {
      let requested = 0
      let approved = 0
      let rejected = 0
      for (const s of data.statusCounts) {
        if (s.q_status === LeaveStatus.Requested) requested = Number(s.count)
        else if (s.q_status === LeaveStatus.Approved || s.q_status === LeaveStatus.LeaveApproved)
          approved = Number(s.count)
        else if (s.q_status === LeaveStatus.Rejected) rejected = Number(s.count)
      }
      return { requested, approved, rejected }
    },
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

export function useHolidays() {
  const year = new Date().getFullYear()

  return useQuery({
    queryKey: dashboardKeys.holidays(year),
    queryFn: () => getHolidays(year),
    select(data: Holiday[]) {
      const today = new Date(new Date().toDateString())
      const upcoming = data.filter((h) => {
        const d = new Date(h.date.split("T")[0])
        return d >= today
      })

      let nextMonth = ""
      let nextDay = "0"
      if (upcoming.length > 0) {
        const dateStr = upcoming[0].date.split("T")[0]
        nextMonth = new Date(dateStr).toLocaleString("en-US", { month: "long" })
        nextDay = new Date(dateStr).getDate().toString()
      }

      const formattedList = data.map((h) => ({
        date: h.date,
        description: h.description,
      }))

      return { list: formattedList, nextMonth, nextDay }
    },
    ...staleOptions,
  })
}


export function useUserCount() {
  return useQuery({
    queryKey: dashboardKeys.userCount(),
    queryFn: getUserCount,
    ...staleOptions,
  })
}


export function useActiveUsers() {
  return useQuery({
    queryKey: dashboardKeys.activeUsers(),
    queryFn: getActiveUsers,
    ...staleOptions,
  })
}


export function useDepartmentCount() {
  return useQuery({
    queryKey: dashboardKeys.departmentCount(),
    queryFn: getDepartmentCount,
    ...staleOptions,
  })
}


export function useProgramCount() {
  return useQuery({
    queryKey: dashboardKeys.programCount(),
    queryFn: getProgramCount,
    ...staleOptions,
  })
}


export function useJpCpTotals() {
  return useQuery({
    queryKey: dashboardKeys.jpCpTotals(),
    queryFn: getJpCpTotals,
    select(data: JpCpTotals | null) {
      return data
    },
    ...staleOptions,
  })
}


export function useReportsByRole() {
  return useQuery({
    queryKey: dashboardKeys.reports(),
    queryFn: getReportsByRole,
    select(data: ReportItem[]) {
      return data
    },
    ...staleOptions,
  })
}
