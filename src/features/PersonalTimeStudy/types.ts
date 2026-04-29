import type { TimeStudyLeaveType, TimeStudyRecordStatus, TimeStudyRecordType } from "./enums/PersonalTimeStudy.enum"

export * from "./enums/PersonalTimeStudy.enum"

/** Response for a single time study record. */
export type TimeStudyRecordResDto = {
  id: number
  userId: string
  username: string
  departmentId: number
  departmentname?: string
  departmentcode?: string
  programid?: string
  programcode: string
  programname: string
  activityid?: string
  activitycode: string
  activityname: string
  parentactivitycode: string
  parentactivityname: string
  starttime?: string
  endtime?: string
  activitytime: number
  traveltime: number 
  status: TimeStudyRecordStatus
  comments?: string
  date: string
  description?: string
  notes?: string
  leave: TimeStudyLeaveType
  leaveid?: number
  apportioning: boolean
  parentId?: number
  recordType: TimeStudyRecordType
  createdAt: string
  updatedAt: string
}

/** Legend data for a single day in the calendar. */
export type UserMonthLegendDayResDto = {
  date: string
  dayType: "working" | "holiday" | "weekend"
  leaveIndicator: boolean
  allocatedMinutes: number
  consumedMinutes: number
  leaveMinutes: number
  balanceMinutes: number
  status: string
  minutes: number
  notes: string | null
  holidayDescription: string | null
  isHoliday: boolean
  isCurrent: boolean
  color: string | null
}

/** Response for the month legend API. */
export type UserMonthLegendResDto = {
  data: UserMonthLegendDayResDto[]
  include_weekend: string
  "sat-sun": string
}

/** Snapshot of a leave record for a specific day. */
export type UserLeaveDaySnapshotResDto = {
  id: number
  userId: string
  programcode: string
  programname: string
  activitycode: string
  activityname: string
  startdt: string
  enddt: string
  starttime: string
  endtime: string
  leaveTotalTime: number
  status: string
}

/** Full detail for a selected day. */
export type UserDayLegendDetailResDto = {
  date: string
  dayType: "working" | "holiday" | "weekend"
  leaveIndicator: boolean
  allocatedMinutes: number
  consumedMinutes: number
  leaveMinutes: number
  balanceMinutes: number
  notes: string | null
  timeStudyRecords: TimeStudyRecordResDto[]
  leaveRecords: UserLeaveDaySnapshotResDto[]
  legend: UserMonthLegendDayResDto
}

/** Payload for saving/submitting time records. */
export type TimeStudyRecordSubmitItemDto = {
  id?: number
  date: string
  starttime?: string
  endtime?: string
  programid: string
  activityid: string
  description?: string
  status?: TimeStudyRecordStatus
  subRows?: {
    programid: string
    activityid: string
    activitytime: number
    description?: string
  }[]
}

/** Payload for saving notes. */
export type SubmitNotesReqDto = {
  date: string
  notes: string
}
/** Filter values for the personal time study search. */
export type PersonalTimeStudyFilterFormValues = {
  search: string
}

/** Pagination state for personal time study lists. */
export type PersonalTimeStudyPagination = {
  page: number
  pageSize: number
  totalItems: number
}

/** Placeholder for list row (if needed for table views). */
export type PersonalTimeStudyRow = TimeStudyRecordResDto
