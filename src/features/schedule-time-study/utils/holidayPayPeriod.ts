import type { DateInputValue, HolidayCalendarApiDto } from "../types"
import {
  countWeekdaysInclusive as countWeekdaysInclusiveDayjs,
  normalizeDateInputValue,
  parseIsoYyyyMmDd,
  parseMmDdYyyy,
} from "./dates"

export function countWeekdaysInclusive(
  startDateValue: DateInputValue,
  endDateValue: DateInputValue,
): number {
  const normalizedStart = normalizeDateInputValue(startDateValue)
  const normalizedEnd = normalizeDateInputValue(endDateValue)
  return countWeekdaysInclusiveDayjs(normalizedStart, normalizedEnd)
}

/**
 * Holidays that fall on a weekday inside [start, end] (pay period), excluding optional days
 * for allocable/non-allocable math.
 */
export function filterWeekdayHolidaysInPayPeriodRange(
  startMmDdYyyy: string,
  endMmDdYyyy: string,
  holidays: HolidayCalendarApiDto[],
): HolidayCalendarApiDto[] {
  const start = parseMmDdYyyy(normalizeDateInputValue(startMmDdYyyy))
  const end = parseMmDdYyyy(normalizeDateInputValue(endMmDdYyyy))
  if (!start || !end || start.isAfter(end, "day")) return []

  const startDay = start.startOf("day")
  const endDay = end.startOf("day")

  const qualifying: HolidayCalendarApiDto[] = []
  for (const h of holidays) {
    if (h.optional) continue
    // Holiday table stores `date` as YYYY-MM-DD.
    const hd = parseIsoYyyyMmDd(h.date)
    if (!hd) continue
    const holidayDay = hd.startOf("day")
    if (holidayDay.isBefore(startDay, "day") || holidayDay.isAfter(endDay, "day")) continue
    const dow = holidayDay.day()
    if (dow === 0 || dow === 6) continue
    qualifying.push(h)
  }
  return qualifying
}

export function buildHolidayIdsCsv(rows: HolidayCalendarApiDto[]): string {
  return rows.map((h) => String(h.id)).join(",")
}
