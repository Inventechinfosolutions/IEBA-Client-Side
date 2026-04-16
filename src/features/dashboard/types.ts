

export interface TimeStudyStatusCount {
  status: string
  totalActivityTime: number
}

export interface TimeStudySuperStatusCount {
  q_status: string
  count: number
}

export interface TimeStudyAggregateResult {
  statusCounts: TimeStudyStatusCount[]
}

export interface TimeStudySuperAggregateResult {
  statusCounts: TimeStudySuperStatusCount[]
}

export interface TimeStudyAggFilter {
  startDate: string
  endDate: string
  userId: string | number
  type: string
  status: string
  usertype?: string
}



export interface LeaveStatusCount {
  q_status: string
  count: number
}

export interface LeaveAggregateResult {
  statusCounts: LeaveStatusCount[]
}

export interface SelfLeaveStats {
  requested: number
  approved: number
  rejected: number
  total: number
}

export interface StaffLeaveStats {
  requested: number
  approved: number
  rejected: number
}


export interface TodoItem {
  id: string | number
  key?: string | number
  title: string
  description?: string
  status: string
  createdAt: string
  day?: string
}

export interface TodoListResult {
  items: TodoItem[]
}



import { HolidayType } from "./enums/dashboard.enum"

export interface Holiday {
  date: string
  description: string
}

export interface HolidayQueryParams {
  type: HolidayType
  year: number
}

export interface DepartmentCountResult {
  count: number
}

export interface ProgramCountResult {
  count: number
}

export interface JpCpTotals {
  jobPools: number
  costPools: number
}

export interface ReportItem {
  id: string | number
  code: string
  name: string
  filename?: string
  path?: string
  criteria?: unknown
}

export interface PayrollDateRange {
  startDate: string
  endDate: string
  totalWeekdays: number
  periodLabel: string
}

export interface PayrollManagementCardProps {
  canViewPayroll?: boolean
  onDownloadTemplate?: () => void
}

export interface PayrollChartData {
  month: string
  progress: number
}

export interface PersonalLeaveCardProps {
  total: number
  approved: number
  open: number
  rejected: number
  nextHolidayMonth: string
  nextHolidayDay: string
  isLoading?: boolean
}

export interface PersonalTimeStudyCardProps {
  totalApproved: number
  totalSubmitted: number
  percent: string
  periodLabel: string
  isLoading?: boolean
  noBlur?: boolean
}

export interface ReportsCardProps {
  reports: ReportItem[]
  isLoading?: boolean
}

export interface TimeStudyStatusCardProps {
  approved: number
  pendingApproval: number
  notSubmitted: number
  isLoading?: boolean
}

export interface TodoCardProps {
  items: TodoItem[]
  isLoading?: boolean
}

export interface UsersCardProps {
  userCount: number
  activeUsers: number
  isLoading?: boolean
}

export interface StaffStatsCardProps {
  open: number
  approved: number
  rejected: number
  deptCount: number
  programCount: number
  activitiesCount?: number
  jobPools?: number
  costPools?: number
  isLoading?: boolean
}

export interface StatRowProps {
  label: string
  value: number | string
  loading?: boolean
}

export interface NavRowProps {
  to?: string
  label: string
  value?: number | string
  loading?: boolean
}

export interface StatusRowProps {
  icon: string
  label: string
  count: number
  actionLabel: string
  onAction: () => void
  loading?: boolean
}



export interface DashboardSummary {

  totalTSApproved: number
  totalTSSubmitted: number
  tsPercent: number
  currentPeriodLabel: string


  totalTRApprovedBy: number
  totalTRApprovalRequest: number
  totalTRNotSubmitted: number


  selfLeave: SelfLeaveStats


  staffLeave: StaffLeaveStats


  holidayList: Holiday[]
  nextHolidayMonth: string
  nextHolidayDay: string


  todos: TodoItem[]


  overview: DashboardOverview | null

  reports: ReportItem[]
}



export interface DashboardOverview {
  totalUserCount: number
  totalCostPoolCount: number
  totalJobPoolCount: number
  totalDepartmentCount: number
  totalTimeStudyProgramCount: number
  totalActivityCount: number
  totalActivityDepartmentCount: number
}

export interface ApiEnvelope<T> {
  statusCode: number
  data: T
  message?: string
}
