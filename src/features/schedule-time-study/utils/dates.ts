import dayjs, { type Dayjs } from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat"

dayjs.extend(customParseFormat)

export const MM_DD_YYYY = "MM-DD-YYYY" as const
export const YYYY_MM_DD = "YYYY-MM-DD" as const

export function parseMmDdYyyy(value: string): Dayjs | null {
  const d = dayjs(value.trim(), MM_DD_YYYY, true)
  return d.isValid() ? d : null
}

export function compareMmDdYyyy(a: string, b: string): number {
  const da = parseMmDdYyyy(a)
  const db = parseMmDdYyyy(b)
  if (!da || !db) return Number.NaN
  if (da.isSame(db, "day")) return 0
  return da.isBefore(db, "day") ? -1 : 1
}

export function parseFlexibleToMmDdYyyy(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === "string") {
    const s = value.trim()
    if (!s) return null
    const d = dayjs(s, [MM_DD_YYYY, YYYY_MM_DD, "M/D/YYYY", "MM/DD/YYYY"], true)
    return d.isValid() ? toMmDdYyyy(d) : null
  }
  // XLSX may provide Date objects when `cellDates: true`.
  if (value instanceof Date) {
    const d = dayjs(value)
    return d.isValid() ? toMmDdYyyy(d) : null
  }
  return null
}

export function parseIsoYyyyMmDd(value: string): Dayjs | null {
  const d = dayjs(value.trim(), YYYY_MM_DD, true)
  return d.isValid() ? d : null
}

export function toMmDdYyyy(value: Dayjs): string {
  return value.format(MM_DD_YYYY)
}

export function toIsoYyyyMmDd(value: Dayjs): string {
  return value.format(YYYY_MM_DD)
}

/** Convert `<input type="date">` value to UI state `MM-DD-YYYY`. */
export function normalizeDateInputValue(value: unknown): string {
  if (typeof value !== "string") return ""
  const iso = parseIsoYyyyMmDd(value)
  if (iso) return toMmDdYyyy(iso)
  const mmdd = parseMmDdYyyy(value)
  return mmdd ? toMmDdYyyy(mmdd) : value.trim()
}

/** Convert UI state `MM-DD-YYYY` to `<input type="date">` value. */
export function toDateInputValue(mmDdYyyy: string): string {
  const d = parseMmDdYyyy(mmDdYyyy)
  return d ? toIsoYyyyMmDd(d) : ""
}

export function endOfMonthMmDdYyyy(startMmDdYyyy: string): string | null {
  const d = parseMmDdYyyy(startMmDdYyyy)
  return d ? toMmDdYyyy(d.endOf("month")) : null
}

export function addDaysMmDdYyyy(startMmDdYyyy: string, days: number): string | null {
  const d = parseMmDdYyyy(startMmDdYyyy)
  return d ? toMmDdYyyy(d.add(days, "day")) : null
}

export function isStartOnOrBeforeEnd(startMmDdYyyy: string, endMmDdYyyy: string): boolean {
  const s = parseMmDdYyyy(startMmDdYyyy)
  const e = parseMmDdYyyy(endMmDdYyyy)
  if (!s || !e) return false
  return s.isSame(e, "day") || s.isBefore(e, "day")
}

export function isWithinInclusive(
  valueMmDdYyyy: string,
  startMmDdYyyy: string,
  endMmDdYyyy: string,
): boolean {
  const v = parseMmDdYyyy(valueMmDdYyyy)
  const s = parseMmDdYyyy(startMmDdYyyy)
  const e = parseMmDdYyyy(endMmDdYyyy)
  if (!v || !s || !e) return false
  return (v.isSame(s, "day") || v.isAfter(s, "day")) && (v.isSame(e, "day") || v.isBefore(e, "day"))
}

export function nextMonthRangeFromPrevious(
  prevStartMmDdYyyy: string,
  prevEndMmDdYyyy: string,
): { startDate: string; endDate: string } | null {
  const end = parseMmDdYyyy(prevEndMmDdYyyy) ?? parseMmDdYyyy(prevStartMmDdYyyy)
  if (!end) return null
  const start = end.add(1, "month").startOf("month")
  return { startDate: toMmDdYyyy(start), endDate: toMmDdYyyy(start.endOf("month")) }
}

/** Inclusive weekday count (Mon–Fri) between start and end, in local time. */
export function countWeekdaysInclusive(startMmDdYyyy: string, endMmDdYyyy: string): number {
  const start = parseMmDdYyyy(startMmDdYyyy)
  const end = parseMmDdYyyy(endMmDdYyyy)
  if (!start || !end || start.isAfter(end, "day")) return 0

  let count = 0
  let current = start.startOf("day")
  const endDay = end.startOf("day")
  while (current.isSame(endDay, "day") || current.isBefore(endDay, "day")) {
    const dow = current.day() // 0 Sun ... 6 Sat
    if (dow !== 0 && dow !== 6) count += 1
    current = current.add(1, "day")
  }
  return count
}

