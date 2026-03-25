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
  selectedDepartment: string
  onSave: (row: ScheduleTimeStudyPeriodRow) => void
  editingRow?: ScheduleTimeStudyPeriodRow | null
}

export const FISCAL_YEAR_OPTIONS = [
  "2018-2019",
  "2019-2020",
  "2020-2021",
  "2021-2022",
  "2022-2023",
  "2023-2024",
  "2024-2025",
  "2025-2026",
] as const

export type FiscalYearOption = (typeof FISCAL_YEAR_OPTIONS)[number]
export type FiscalYearValue = FiscalYearOption | string
export type DateInputValue = string
export type ParsedMmDdYyyyDate = Date | null
export type FiscalYearMonthRange = {
  startDate: DateInputValue
  endDate: DateInputValue
}
export type TimeStudyPeriodsEditingRow = ScheduleTimeStudyPeriodRow | null | undefined
export type TimeStudyPeriodsDepartmentValue = TimeStudyPeriodsFormProps["selectedDepartment"]
export const DEPARTMENT_LABEL_MAP: Record<string, string> = {
  "behavioral-health": "Behavioral Health",
  "public-health": "Public Health",
  "social-services": "Social Services",
}

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
  jobPool: boolean
  costPool: boolean
  user: boolean
  canView?: boolean
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
  selectedStudyYear: string
  editingRow?: ParticipantsListRow | null
  onSave: (row: ParticipantsListRow) => void
}

export type ParticipantUsersModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export type ParticipantsListTableProps = {
  studyYear: string
  selectedDepartment: string
  onStudyYearChange: (value: string) => void
}

export type ScheduleTimeStudyEntry = {
  timeStudyPeriod: string
  groups: string
  status: "Draft" | "Published"
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

export type ScheduleTimeStudyFormProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDepartment: string
  selectedStudyYear: string
  periodRows: ScheduleTimeStudyPeriodRow[]
  participantGroupOptions: string[]
  onSave: (rows: ScheduledTimeStudyRow[]) => void
}

export type ScheduledTimeStudyTableProps = {
  selectedStudyYear: string
  onStudyYearChange: (value: string) => void
  selectedDepartment: string
  periodRows: ScheduleTimeStudyPeriodRow[]
}

export type TimeStudyTabProps = {
  value: string
  label: string
}
