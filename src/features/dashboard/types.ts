

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



export interface Holiday {
  date: string
  description: string
}

export interface HolidayQueryParams {
  type: "yearly"
  year: number
}



export interface UserCountResult {
  count: number
}

export interface ActiveUserResult {
  userCount: number
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



export type PayrollPeriodType = "weekly" | "biweekly" | "semimonthly" | "monthly"

export interface PayrollDateRange {
  startDate: string
  endDate: string
  totalWeekdays: number
  periodLabel: string
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


  userCount: number
  activeUsers: number
  deptCount: number
  tspCount: number
  jpCpTotals: JpCpTotals | null

  reports: ReportItem[]
}



export interface ApiEnvelope<T> {
  statusCode: number
  data: T
  message?: string
}
