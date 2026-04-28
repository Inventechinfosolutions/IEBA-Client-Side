// ─── Employee row from the user list ─────────────────────────────────────────
export type MgtEmployeeRow = {
  id: string
  employee: string
  firstName?: string
  lastName?: string
  department?: string
}

// ─── Day status from month-legend response ────────────────────────────────────
export type MgtDayStatus = {
  status: string
  color?: string
  allocatedMinutes?: number
  consumedMinutes?: number
  balanceMinutes?: number
}

// ─── Month legend map ─────────────────────────────────────────────────────────
export type MgtDayStatusMap = Record<string, MgtDayStatus>

/** Week summary for the calendar grid. */
export type MgtWeekSummary = {
  totalMinutes: number
  status: string
}

/** Full data structure for the MGT legend. */
export type MgtMonthLegendData = {
  dayMap: MgtDayStatusMap
  weekSummaries: Record<string, MgtWeekSummary>
  allocatedTotal: number
  actualTotal: number
  balanceTotal: number
}

// ─── Minutes summary shown in the bottom bar ─────────────────────────────────
export type MgtMinutesSummary = {
  allocatedMinutes: number
  actualMinutes: number
  balanceMinutes: number
}

// ─── Filter / pagination state ────────────────────────────────────────────────
export type MgtFilterState = {
  search: string
}

export type MgtPagination = {
  page: number
  pageSize: number
  totalItems: number
}
