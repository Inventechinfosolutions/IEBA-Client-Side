export type FiscalYearHolidayModel = {
  date: string
  holiday: string
  optional: boolean
}

export type FiscalYearSettingsModel = {
  fiscalYearStartMonth: string
  fiscalYearEndMonth: string
  year: string
  /** Ranges added via "Add/Edit Fiscal Year"; listed last in the Year dropdown */
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

/** Match typical vertical scrollbar width so header columns align with body + scrollbar. */
export const HOLIDAY_TABLE_SCROLLBAR_PAD_PX = 17

/** Body-only scroll area (max visible rows); header sits above and does not scroll. */
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

