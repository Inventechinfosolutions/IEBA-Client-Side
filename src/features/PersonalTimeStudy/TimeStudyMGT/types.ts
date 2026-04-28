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
}

// ─── Month legend map ─────────────────────────────────────────────────────────
export type MgtDayStatusMap = Record<string, MgtDayStatus>

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
