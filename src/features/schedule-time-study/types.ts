import type {
  RmtsGroupTypeValue,
  SchedulePayPeriodGroupStatus,
} from "./enums/schedule-time-study.enum"
import type { Department } from "@/features/department/types"

/** Fiscal year row from `GET /setting/fiscalyear` (normalized for dropdowns). */
export type ScheduleTimeStudyFiscalYearOption = {
  id: string
  label: string
  /** `FiscalYear.start` from API (typically MM-DD-YYYY). Used for default first pay-period dates. */
  start?: string
  /** `FiscalYear.end` from API (typically MM-DD-YYYY). */
  end?: string
}


export type HolidayCalendarApiDto = {
  id: number
  date: string
  description: string
  optional: boolean
}

export type ScheduleTimeStudyTab =
  | "time-study-period-management"
  | "participants-list"
  | "scheduled-time-study"

export type ScheduleTimeStudyPeriodRow = {
  id: string
  timeStudyPeriod: string
  startDate: string
  endDate: string
  hours: number
  holidays: number
  allocable: number
  nonAllocable: number
  /** True when this pay period is linked to Scheduled Time Study; UI hides edit/delete. */
  isUsed: boolean
}

export type ScheduleTimeStudyFormValues = {
  department: string
  studyYear: string
  file: File | null
}

export type TimeStudyPeriodsFormValues = {
  fiscalYear: string
  department: string
  timeStudyPeriod: string
  startDate: string
  endDate: string
  hours: string
  holidays: string
  allocable: string
  nonAllocable: string
}

export type TimeStudyPeriodsFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Department row id (string) from `Department.id`. */
  selectedDepartment: string
  selectedDepartmentName: string
  departmentId: number | null
  fiscalYearOptions: readonly ScheduleTimeStudyFiscalYearOption[]
  editingRow?: ScheduleTimeStudyPeriodRow | null
}

export type FiscalYearValue = string
export type DateInputValue = string
export type ParsedMmDdYyyyDate = Date | null
export type FiscalYearMonthRange = {
  startDate: DateInputValue
  endDate: DateInputValue
}
export type TimeStudyPeriodsEditingRow = ScheduleTimeStudyPeriodRow | null | undefined
export type TimeStudyPeriodsDepartmentValue = TimeStudyPeriodsFormProps["selectedDepartment"]

/** Fallback group labels when the participants query returns no rows. */
export const DEFAULT_SCHEDULE_PARTICIPANT_GROUP_OPTIONS = ["SS", "SS | Test Group 1"] as const

/** Fiscal year label (e.g. `2025-2026`) from a period row date in `MM-DD-YYYY`. */
export function getFiscalYearLabelFromMmDdYyyy(dateValue: string): string {
  const mmDdYyyy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dateValue.trim())
  if (!mmDdYyyy) return ""
  const month = Number(mmDdYyyy[1])
  const year = Number(mmDdYyyy[3])
  if (!Number.isFinite(month) || !Number.isFinite(year)) return ""
  const startYear = month >= 7 ? year : year - 1
  return `${startYear}-${startYear + 1}`
}

export type ParticipantsListRow = {
  id: string
  groupName: string
  /** Normalized from `RmtsGroup.grouptype`. */
  grouptype: RmtsGroupTypeValue
  jobPool: boolean
  costPool: boolean
  user: boolean
  /**
   * True when the group is locked (e.g. referenced by scheduled time study).
   * From `GET /rmtsgroup` `isUsed` / `is_used`.
   */
  isUsed: boolean
}

export type ParticipantsListFormValues = {
  groupName: string
  department: string
  studyYear: string
  selectedUserBy: "job-pool" | "user"
}

export type ParticipantsListFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDepartment: string
  selectedDepartmentName: string
  selectedStudyYear: string
  departmentId: number | null
  fiscalYearOptions: readonly ScheduleTimeStudyFiscalYearOption[]
  editingRow?: ParticipantsListRow | null
}

export type ParticipantUsersModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  /** Department name for the grey header row (same as create form “User” tree). */
  departmentLabel?: string
  loading?: boolean
  users?: Array<{ id: string; label: string }>
  grouptype?: RmtsGroupTypeValue
}

export type ParticipantsListTableProps = {
  studyYear: string
  selectedDepartment: string
  selectedDepartmentName: string
  departmentId: number | null
  fiscalYearOptions: readonly ScheduleTimeStudyFiscalYearOption[]
  onStudyYearChange: (value: string) => void
}

export type ScheduleTimeStudyEntry = {
  timeStudyPeriod: string
  groups: string
  status: SchedulePayPeriodGroupStatus
}

export type ScheduleTimeStudyModalFormValues = {
  studyYear: string
  department: string
  entries: ScheduleTimeStudyEntry[]
}

export type ScheduledTimeStudyRow = {
  id: string
  timeStudyPeriod: string
  startDate: string
  endDate: string
  groups: string
  status: string
}

export type ScheduledTimeStudyRowEnriched = ScheduledTimeStudyRow & {
  /** RMTS pay period id */
  ppId: number
  /** CSV of group ids */
  groupIds: string
  /** Raw status value from API */
  statusRaw: SchedulePayPeriodGroupStatus
}

export type ScheduleTimeStudyFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDepartment: string
  selectedDepartmentName: string
  selectedStudyYear: string
  departmentId: number | null
  fiscalYearOptions: readonly ScheduleTimeStudyFiscalYearOption[]
  periodRows: ScheduleTimeStudyPeriodRow[]
  participantGroupOptions: string[]
  groupsDetailed: RmtsGroupApiDto[]
  editingRow?: ScheduledTimeStudyRowEnriched | null
}

export type ScheduledTimeStudyTableProps = {
  selectedStudyYear: string
  onStudyYearChange: (value: string) => void
  selectedDepartment: string
  selectedDepartmentName: string
  departmentId: number | null
  fiscalYearOptions: readonly ScheduleTimeStudyFiscalYearOption[]
  periodRows: ScheduleTimeStudyPeriodRow[]
}

export type TimeStudyTabProps = {
  value: string
  label: string
}

// —— API wire types (RMTS backend) ——

export type RmtsPayPeriodApiDto = {
  id: number
  name: string
  startdt: string
  enddt: string
  hours: number
  holidayhours?: number
  allocatetime: number
  nonallocatetime: number
  departmentId: number
  fiscalyear: string
  holidays?: string
  payDate?: string | null
  payRun?: string | null
  isUsed?: boolean
  is_used?: boolean
}

export type RmtsGroupApiDto = {
  id: number
  name: string
  fiscalyear: string
  grouptype: string
  departmentId: number
  users?: string[]
  jobPools?: string[]
  /** When true, the group must not be edited or deleted (e.g. used in scheduling). */
  isUsed?: boolean
  /** Alternate wire shape; normalized to row `isUsed` in the mapper. */
  is_used?: boolean
}

export type RmtsPpGroupListEnrichedApiDto = {
  id: number
  ppId: number
  departmentId: number
  groupIds: string
  status: SchedulePayPeriodGroupStatus
  fiscalyear: string
  payPeriodName: string
  payPeriodStartdt: string
  payPeriodEnddt: string
  groups: RmtsGroupApiDto[]
}

export type CreateRmtsPayPeriodPayload = {
  name: string
  startdt: string
  enddt: string
  hours: number
  holidayhours?: number
  allocatetime: number
  nonallocatetime: number
  departmentId: number
  fiscalyear: string
  holidays?: string
  payDate?: string
  payRun?: string
}

export type UpdateRmtsPayPeriodPayload = Partial<CreateRmtsPayPeriodPayload>

export type CreateRmtsGroupPayload = {
  name: string
  fiscalyear: string
  grouptype: string
  departmentId: number
  users?: string[]
  jobPools?: string[]
}

export type UpdateRmtsGroupPayload = Partial<CreateRmtsGroupPayload>

export type CreateRmtsPpGroupListItemPayload = {
  ppId: number
  departmentId: number
  groupIds: string
  status: SchedulePayPeriodGroupStatus
  fiscalyear: string
}

export type CreateRmtsPpGroupListBatchPayload = {
  items: CreateRmtsPpGroupListItemPayload[]
}

// —— API wire types (Users by department; legacy RMTS endpoint) ——

export type ScheduleTimeStudyDepartmentUserApiDto = {
  id: string
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  user?: { loginId?: string | null } | null
}

export type ScheduleTimeStudyUsersByDepartmentApiDto = {
  departmentId: number
  departmentName: string
  departmentCode: string
  users: ScheduleTimeStudyDepartmentUserApiDto[]
}

export type ScheduleTimeStudyTableLoadedProps = {
  departments: Department[]
  fiscalYearOptions: ScheduleTimeStudyFiscalYearOption[]
}

export type CreateRmtsPpGroupListBatchResult = {
  created: Array<{
    id: number
    ppId: number
    departmentId: number
    groupIds: string
    status: string
    fiscalyear: string
  }>
}

export type PaginationMeta = {
  total?: number
  totalItems?: number
  itemCount?: number
  totalPages?: number
}

export type JobPoolJobClassificationResDto = {
  id?: number
  code?: string
  name?: string
  status?: unknown
}

export type JobPoolUserResDto = {
  id?: string
  firstName?: string | null
  lastName?: string | null
  name?: string | null
}

export type JobPoolDepartmentResDto = {
  id?: number
  code?: string
  name?: string
}

export type JobPoolResDto = {
  id?: number
  name?: string
  description?: string | null
  status?: unknown
  departmentId?: number
  activities?: number[]
  users?: string[]
  jobClassificationDetails?: JobPoolJobClassificationResDto[]
  userDetails?: JobPoolUserResDto[]
  department?: JobPoolDepartmentResDto
}

// —— Query param types (frontend) ——

export type RmtsEntityByIdQueryParams = {
  id: number | null
  enabled?: boolean
}

export type GetRmtsGroupsQueryParams = {
  departmentId: number | null
  fiscalyear: string
}

export type GetRmtsPayPeriodsQueryParams = {
  departmentId: number | null
  fiscalyear: string
  enabled?: boolean
}

export type FetchScheduleTimeStudyPeriodRowsParams = {
  departmentId: number
  fiscalyear: string
}

export type GetRmtsPpGroupListEnrichedQueryParams = {
  departmentId: number | null
  fiscalyear: string
}

export type GetScheduleTimeStudyJobPoolsByDepartmentQueryParams = {
  departmentId: number | null
  enabled?: boolean
}

export type GetScheduleTimeStudyUsersByDepartmentQueryParams = {
  departmentId: number | null
}

export type GetScheduleTimeStudyHolidayListByDateRangeParams = {
  startmonth: string
  endmonth: string
}
