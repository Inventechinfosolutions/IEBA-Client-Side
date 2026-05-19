
export interface TodoItem {
  id: string | number
  key?: string | number
  title: string
  description?: string
  status: string
  createdAt?: string
  updatedAt?: string
  completedAt?: string
  completedDate?: string
  day?: string
}

export interface Holiday {
  date: string
  description: string
}

export interface ReportItem {
  id: string | number
  code: string
  name: string
  filename?: string
  path?: string
  criteria?: unknown
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
  activeUsers?: number
  showActiveUsers?: boolean
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
export interface DashboardOverview {
  totalUserCount: number;
  totalActiveUserCount: number;
  totalCostPoolCount: number;
  totalJobPoolCount: number;
  totalDepartmentCount: number;
  totalTimeStudyProgramCount: number;
  totalActivityCount: number;
  totalActivityDepartmentCount: number;
  timeStudyRecordStatusCounts?: Array<{ status: string; count: number }>;
  timeStudyRecordByUserStatusCounts?: Array<{ status: string; count: number }>;
  todoTotal?: number;
  todoStatusCounts?: Array<{ status: string; count: number }>;
  personalLeaveTotal?: number;
  personalLeaveStatusCounts?: Array<{ status: string; count: number }>;
  staffLeaveTotal?: number;
  staffLeaveStatusCounts?: Array<{ status: string; count: number }>;
  holidayList?: Holiday[];
  todoList?: TodoItem[];
}

export interface ApiEnvelope<T> {
  statusCode: number
  data: T
  message?: string
}
