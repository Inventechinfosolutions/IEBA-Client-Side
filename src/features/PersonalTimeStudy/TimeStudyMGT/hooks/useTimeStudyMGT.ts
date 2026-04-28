import { useMemo, useState } from "react"
import { useGetMGTEmployeeList } from "../queries/useGetMGTEmployeeList"
import { useGetMGTMonthLegend } from "../queries/useGetMGTMonthLegend"
import type { MgtEmployeeRow, MgtDayStatusMap, MgtWeekSummary } from "../types"

/**
 * Helper to get the start of the week (Sunday) for a given YYYY-MM-DD date string.
 */
function getWeekStartKey(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z') // Use midday UTC to avoid TZ issues
  const day = date.getUTCDay()
  const diff = date.getUTCDate() - day
  const sunday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff))
  const y = sunday.getUTCFullYear()
  const m = String(sunday.getUTCMonth() + 1).padStart(2, '0')
  const d = String(sunday.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Master UI state hook for the Time Study MGT tab.
 * Encapsulates: employee selection, month navigation, search, and data fetching.
 */
export function useTimeStudyMGT() {
  const [search, setSearch]                           = useState("")
  const [selectedUserId, setSelectedUserId]           = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee]       = useState<MgtEmployeeRow | null>(null)
  const [currentDate, setCurrentDate]                 = useState(new Date())

  const month = currentDate.getMonth() + 1
  const year  = currentDate.getFullYear()

  // ── Queries ──────────────────────────────────────────────────────────────
  const employeeListQuery = useGetMGTEmployeeList(search || undefined)
  const monthLegendQuery  = useGetMGTMonthLegend(selectedUserId, month, year)

  // ── Derived data ──────────────────────────────────────────────────────────
  const employees = employeeListQuery.data ?? []

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees
    const q = search.toLowerCase()
    return employees.filter(e => e.employee?.toLowerCase().includes(q))
  }, [employees, search])

  const { dayStatuses, weekSummaries, allocatedTotal, actualTotal, balanceTotal } = useMemo(() => {
    const dayMap: MgtDayStatusMap = {}
    const weekMap: Record<string, MgtWeekSummary & { days: string[] }> = {}
    let allocatedTotal = 0
    let actualTotal = 0
    let balanceTotal = 0

    const rawData = monthLegendQuery.data?.data ?? []

    for (const d of rawData) {
      dayMap[d.date] = {
        status: d.status,
        color: d.color ?? undefined,
        allocatedMinutes: d.allocatedMinutes,
        consumedMinutes: d.consumedMinutes,
        balanceMinutes: d.balanceMinutes,
      }

      allocatedTotal += d.allocatedMinutes ?? 0
      actualTotal += d.consumedMinutes ?? 0
      balanceTotal += d.balanceMinutes ?? 0

      // Roll up to week summary
      const weekKey = getWeekStartKey(d.date)
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { totalMinutes: 0, status: "notsubmitted", days: [] }
      }
      weekMap[weekKey].totalMinutes += d.minutes ?? 0
      weekMap[weekKey].days.push(d.status)
    }

    // Determine week status (simplified: if any day is submitted, week is submitted; if any approved, etc.)
    const finalWeekSummaries: Record<string, MgtWeekSummary> = {}
    for (const [key, val] of Object.entries(weekMap)) {
      let finalStatus = "notsubmitted"
      if (val.days.includes("approved")) finalStatus = "approved"
      else if (val.days.includes("rejected")) finalStatus = "rejected"
      else if (val.days.includes("submitted") || val.days.includes("submittedexceed") || val.days.includes("submittedless")) {
        finalStatus = "submitted"
      }
      finalWeekSummaries[key] = { totalMinutes: val.totalMinutes, status: finalStatus }
    }

    return {
      dayStatuses: dayMap,
      weekSummaries: finalWeekSummaries,
      allocatedTotal,
      actualTotal,
      balanceTotal
    }
  }, [monthLegendQuery.data])

  // ── Actions ───────────────────────────────────────────────────────────────
  function selectEmployee(employee: MgtEmployeeRow) {
    setSelectedUserId(employee.id)
    setSelectedEmployee(employee)
  }

  function clearSelection() {
    setSelectedUserId(null)
    setSelectedEmployee(null)
  }

  return {
    // State
    search,
    setSearch,
    selectedUserId,
    selectedEmployee,
    currentDate,
    setCurrentDate,
    month,
    year,

    // Data
    filteredEmployees,
    dayStatuses,
    weekSummaries,
    allocatedTotal,
    actualTotal,
    balanceTotal,

    // Loading states
    isEmployeeListLoading: employeeListQuery.isLoading,
    isMonthLegendLoading:  monthLegendQuery.isLoading,

    // Actions
    selectEmployee,
    clearSelection,
  }
}
