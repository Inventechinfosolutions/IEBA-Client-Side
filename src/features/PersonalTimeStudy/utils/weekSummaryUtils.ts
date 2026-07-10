import { getCalendarWeekStartKeyFromIso } from "@/components/Calender"
import { todayLocal } from "@/lib/dates"
import type { UserMonthLegendDayResDto } from "../types"
import { WORKING_DAYS_PER_WEEK } from "../constants"

/** Week status when every day in the calendar row is still in the future — no icon shown. */
export const FUTURE_WEEK_STATUS = "future"

/** True when all 7 days in a calendar week row are strictly after today. */
export function isCalendarWeekEntirelyFuture(weekStartKey: string): boolean {
  const [y, m, d] = weekStartKey.split("-").map(Number)
  const today = todayLocal()
  const weekStart = new Date(y, m - 1, d)

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
    if (date.getTime() <= today.getTime()) {
      return false
    }
  }
  return true
}

export type WeekRollup = {
  /** Sum of entered minutes for all days in the calendar week row (Mon–Sun). */
  totalMinutes: number
  days: string[]
}

/**
 * Weekly STATUS display rules:
 * - TOTAL(MIN.) = sum of entered minutes for all 7 days in the calendar row
 * - Target = 5 working days × daily allocation (e.g. 5 × 480 = 2400)
 * - Green  → total === 2400
 * - Yellow → total < 2400
 * - Red    → total > 2400
 */
export function getWeeklyStatus(
  days: string[],
  totalMinutes: number,
  targetMinutes: number,
): string {
  if (days.length === 0) return "pending"

  const lowerDays = days.map((d) => String(d || "").toLowerCase())

  if (lowerDays.every((d) => d === "approved")) return "approved"
  if (lowerDays.some((d) => d === "rejected")) return "rejected"

  if (totalMinutes > 0) {
    if (totalMinutes === targetMinutes) return "equal"
    if (totalMinutes < targetMinutes) return "less"
    return "more"
  }

  return "pending"
}

/** Daily allocation from month legend (e.g. 480). */
export function getDailyAssignedMinutes(monthData: UserMonthLegendDayResDto[]): number {
  return monthData.find((d) => (d.allocatedMinutes ?? 0) > 0)?.allocatedMinutes ?? 0
}

/** Fixed weekly target: 5 working days × daily allocation (2400 when daily is 480). */
export function getWeeklyTargetMinutes(dailyAssignedMinutes: number): number {
  return WORKING_DAYS_PER_WEEK * dailyAssignedMinutes
}

export function buildWeekRollups(monthData: UserMonthLegendDayResDto[]): Record<string, WeekRollup> {
  const weekMap: Record<string, WeekRollup> = {}

  for (const d of monthData) {
    const weekKey = getCalendarWeekStartKeyFromIso(d.date)
    if (!weekMap[weekKey]) {
      weekMap[weekKey] = { totalMinutes: 0, days: [] }
    }

    // All 7 calendar days in the row count toward TOTAL(MIN.) — including Sat & Sun.
    weekMap[weekKey].totalMinutes += d.minutes ?? 0
    weekMap[weekKey].days.push(d.status)
  }

  return weekMap
}

export function buildWeekSummariesFromMonthLegend(
  monthData: UserMonthLegendDayResDto[],
): Record<string, { totalMinutes: number; status: string }> {
  const dailyAssignedMinutes = getDailyAssignedMinutes(monthData)
  const weeklyTarget = getWeeklyTargetMinutes(dailyAssignedMinutes)
  const weekMap = buildWeekRollups(monthData)
  const weekSummaries: Record<string, { totalMinutes: number; status: string }> = {}

  for (const [key, val] of Object.entries(weekMap)) {
    weekSummaries[key] = {
      totalMinutes: val.totalMinutes,
      status: isCalendarWeekEntirelyFuture(key)
        ? FUTURE_WEEK_STATUS
        : getWeeklyStatus(val.days, val.totalMinutes, weeklyTarget),
    }
  }

  return weekSummaries
}
