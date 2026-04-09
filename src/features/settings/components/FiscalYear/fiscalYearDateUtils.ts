import { parseIsoYyyyMmDd, toMmDdYyyy } from "@/features/schedule-time-study/utils/dates"

/** Normalize API fiscal date to `YYYY-MM-DD` for inputs and `<input type="date">`. */
export function normalizeFiscalDateToIso(value: string): string {
  const t = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(t)
  if (m) return `${m[3]}-${m[1]}-${m[2]}`
  return t
}

/** Convert `YYYY-MM-DD` to `MM-DD-YYYY` for `GET /setting/holiday/list?type=filter&...`. */
export function isoYmdToHolidayListStartEnd(isoStart: string, isoEnd: string): {
  startmonth: string
  endmonth: string
} | null {
  const a = parseIsoYyyyMmDd(isoStart.trim())
  const b = parseIsoYyyyMmDd(isoEnd.trim())
  if (!a || !b) return null
  return { startmonth: toMmDdYyyy(a), endmonth: toMmDdYyyy(b) }
}

export function isoYmdToDisplayDdMmYyyy(iso: string): string {
  const d = parseIsoYyyyMmDd(iso.trim())
  if (!d) return ""
  const dd = String(d.date()).padStart(2, "0")
  const mm = String(d.month() + 1).padStart(2, "0")
  return `${dd}-${mm}-${d.year()}`
}

/** Parse strict `YYYY-MM-DD` into a local calendar date (no UTC shift). */
export function parseIsoYmdToLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return null
  const year = Number(m[1])
  const monthIndex = Number(m[2]) - 1
  const day = Number(m[3])
  const date = new Date(year, monthIndex, day)
  return Number.isNaN(date.getTime()) ? null : date
}

export function toIsoYmdFromDate(date: Date): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${mo}-${d}`
}

export function parseFiscalYearRangeLabel(value: string): { startYear: number; endYear: number } | null {
  const m = /^(\d{4})-(\d{4})$/.exec(String(value ?? "").trim())
  if (!m) return null
  const startYear = Number(m[1])
  const endYear = Number(m[2])
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return null
  return { startYear, endYear }
}

export function isIsoYmdInRange(iso: string, startIso: string, endIso: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= startIso && iso <= endIso
}

/** Edit/delete allowed for today and future dates only (past rows are read-only). */
export function isHolidayIsoDateTodayOrFuture(isoYmd: string): boolean {
  const d = parseIsoYmdToLocalDate(isoYmd.trim())
  if (!d) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const holidayDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return holidayDay.getTime() >= today.getTime()
}
