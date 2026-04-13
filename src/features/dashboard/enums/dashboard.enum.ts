// ─── Dashboard Enums (as const objects for erasableSyntaxOnly TS config) ────

export const TimeStudyStatus = {
  Approved: "approved",
  Submitted: "submitted",
  NotSubmitted: "not submitted",
} as const
export type TimeStudyStatus = (typeof TimeStudyStatus)[keyof typeof TimeStudyStatus]

export const LeaveStatus = {
  Requested: "requested",
  Approved: "approved",
  LeaveApproved: "leaveApproved",
  Rejected: "rejected",
} as const
export type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus]

export const PayrollPeriod = {
  Weekly: "weekly",
  Biweekly: "biweekly",
  Semimonthly: "semimonthly",
  Monthly: "monthly",
} as const
export type PayrollPeriod = (typeof PayrollPeriod)[keyof typeof PayrollPeriod]

export const DashboardQueryType = {
  Super: "super",
  Monthly: "monthly",
} as const
export type DashboardQueryType = (typeof DashboardQueryType)[keyof typeof DashboardQueryType]

export const HolidayType = {
  Yearly: "yearly",
} as const
export type HolidayType = (typeof HolidayType)[keyof typeof HolidayType]

export const DashboardSection = {
  PersonalTimeStudy: "personalTimeStudy",
  LeaveRequests: "leaveRequests",
  TimeStudyStatus: "timeStudyStatus",
  Todo: "todo",
  Users: "users",
  Holidays: "holidays",
  Payroll: "payroll",
  Reports: "reports",
  StaffLeave: "staffLeave",
  Stats: "stats",
} as const
export type DashboardSection = (typeof DashboardSection)[keyof typeof DashboardSection]
