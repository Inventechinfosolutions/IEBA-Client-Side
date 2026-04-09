/** Row from `GET /setting/fiscalyear` (tenant fiscal years). */
export type SettingsFiscalYearRow = {
  id: string
  label: string
  start: string
  end: string
}

/** Row from `GET /setting/holiday/list` (normalized for the settings UI). */
export type SettingsHolidayCalendarRow = {
  id: number
  /** `YYYY-MM-DD` */
  dateIso: string
  description: string
  optional: boolean
}

/** Legacy form / mock shape; holidays are loaded from the holiday API, not persisted in settings mock. */
export type FiscalYearHolidayModel = {
  date: string
  holiday: string
  optional: boolean
}

export type FiscalYearSettingsModel = {
  fiscalYearStartMonth: string
  fiscalYearEndMonth: string
  year: string
  /** Fiscal year ids available for the Year dropdown (from API). */
  appliedYearRanges: string[]
  holidays: FiscalYearHolidayModel[]
}

export const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const

/** Holiday table: header 110% of 34px + up to 6 body rows (row height = 90% of 44px) */
export const HOLIDAY_TABLE_MAX_BODY_ROWS = 6

export const HOLIDAY_TABLE_ROW_PX = 44 * 0.9

/** Body-only scroll area (max visible rows); used with sticky header in `FiscalYearTable`. */
export const holidayTableBodyScrollMaxHeight = `calc(${HOLIDAY_TABLE_MAX_BODY_ROWS} * ${HOLIDAY_TABLE_ROW_PX}px)`

export type MonthYearPickerProps = {
  value: string
  onChange: (next: string) => void
  useMonthEnd: boolean
}

export type HolidayDraft = {
  date: string
  holiday: string
  optional: boolean
}

export type HolidayDatePickerProps = {
  value: string
  onChange: (next: string) => void
}

export type FiscalYearTableProps = {
  holidays: readonly SettingsHolidayCalendarRow[]
  isLoading: boolean
  onEditRow: (row: SettingsHolidayCalendarRow) => void
  onRemoveRow: (id: number) => void
}

export type SettingsFiscalYearUiValue = {
  fiscalYears: readonly SettingsFiscalYearRow[]
  selectedFiscalYearId: string | undefined
  setSelectedFiscalYearId: (id: string | undefined) => void
  isFiscalYearsPending: boolean
}

export type ListHolidaysByDateRangeParams = {
  startmonth: string
  endmonth: string
  enabled?: boolean
}

