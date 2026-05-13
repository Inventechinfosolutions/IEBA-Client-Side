import { useMemo, useState } from "react"
import { useGetMGTEmployeeList } from "../queries/getMGTEmployeeList"
import { useGetMGTMonthLegend } from "../queries/getMGTMonthLegend"
import { useGetMGTDayDetail } from "../queries/getMGTDayDetail"
import { useGetMGTDropdowns } from "../queries/getMGTDropdowns"
import { useGetTimeEntrySummary } from "../../queries/getTimeEntrySummary"
import { toIsoYmdFromDate, todayLocal } from "@/features/schedule-time-study/utils/dates"
import { usePermissions } from "@/hooks/usePermissions"
import type { MgtEmployeeRow, MgtDayStatusMap, MgtWeekSummary } from "../types"

/**
 * Helper to get the start of the week (Sunday) for a given YYYY-MM-DD date string.
 */
function getWeekStartKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diff = date.getDate() - day
  const sunday = new Date(date.getFullYear(), date.getMonth(), diff)
  return toIsoYmdFromDate(sunday)
}

/**
 * Master UI state hook for the Time Study MGT tab.
 * Encapsulates: employee selection, month navigation, search, and data fetching.
 */
export function useTimeStudyMGT() {
  const [search, setSearch]                           = useState("")
  const [selectedUserId, setSelectedUserId]           = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee]       = useState<MgtEmployeeRow | null>(null)
  const [currentDate, setCurrentDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(todayLocal)

  const month = currentDate.getMonth() + 1
  const year  = currentDate.getFullYear()

  const { isSuperAdmin, assignedDepartmentIds } = usePermissions()

  // ── Queries ──────────────────────────────────────────────────────────────
  const deptFilter = !isSuperAdmin && assignedDepartmentIds.length > 0 ? assignedDepartmentIds.join(",") : undefined
  const employeeListQuery = useGetMGTEmployeeList(search || undefined, deptFilter)
  const monthLegendQuery  = useGetMGTMonthLegend(selectedUserId, month, year)

  const dateStr = selectedDate ? toIsoYmdFromDate(selectedDate) : null
  const dayDetailQuery = useGetMGTDayDetail(
    selectedUserId,
    dateStr,
    selectedDate ? selectedDate.getMonth() + 1 : month,
    selectedDate ? selectedDate.getFullYear() : year
  )
  const dropdownQuery = useGetMGTDropdowns(selectedUserId)
  const summaryQuery  = useGetTimeEntrySummary(selectedUserId || "", dateStr || "", "tsmanagement", !!selectedUserId && !!dateStr)

  // ── Derived data ──────────────────────────────────────────────────────────
  const employees = employeeListQuery.data ?? []

  const filteredEmployees = useMemo(() => {
    if (!search.trim()) return employees
    const q = search.toLowerCase()
    return employees.filter(e => {
      const parts = [e.employee, e.firstName, e.lastName, e.name].filter(Boolean)
      const name = parts.join(" ").toLowerCase()
      return name.includes(q)
    })
  }, [employees, search])

  const { dayStatuses, weekSummaries, allocatedTotal, actualTotal, balanceTotal, legend } = useMemo(() => {
    const dayMap: MgtDayStatusMap = {}
    const weekMap: Record<string, MgtWeekSummary & { days: string[] }> = {}
    let allocatedTotal = 0
    let actualTotal = 0
    let balanceTotal = 0

    const rawData = monthLegendQuery.data?.data ?? []

    for (const d of rawData) {
      const s = String(d.status).toLowerCase()
      const cellColor = (s === "opened" || s === "draft") ? undefined : (d.color ?? undefined)
      dayMap[d.date] = {
        status: d.status,
        color: cellColor,
        allocatedMinutes: d.allocatedMinutes,
        consumedMinutes: d.consumedMinutes,
        balanceMinutes: d.balanceMinutes,
      }

      // Roll up to week summary
      const weekKey = getWeekStartKey(d.date)
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { totalMinutes: 0, status: "notsubmitted", days: [] }
      }
      weekMap[weekKey].totalMinutes += (d.minutes ?? 0) + (d.leaveMinutes ?? 0)
      weekMap[weekKey].days.push(d.status)
    }

    // Calculate totals: prioritize the selected date, fallback to daily average
    if (dateStr && dayMap[dateStr]) {
      allocatedTotal = dayMap[dateStr].allocatedMinutes || 0
      actualTotal    = dayMap[dateStr].consumedMinutes || 0
      balanceTotal   = dayMap[dateStr].balanceMinutes || 0
    } else {
      const workingDays = rawData.filter((d: any) => (d.allocatedMinutes ?? 0) > 0)
      if (workingDays.length > 0) {
        const sumAllocated = workingDays.reduce((acc: number, d: any) => acc + (d.allocatedMinutes || 0), 0)
        const sumActual = workingDays.reduce((acc: number, d: any) => acc + (d.consumedMinutes || 0), 0)
        allocatedTotal = Math.round(sumAllocated / workingDays.length)
        actualTotal = Math.round(sumActual / workingDays.length)
      }
      balanceTotal = allocatedTotal - actualTotal
    }

    // Determine week status
    const finalWeekSummaries: Record<string, MgtWeekSummary> = {}
    for (const [key, val] of Object.entries(weekMap)) {
      let finalStatus = "notsubmitted"
      const lowerDays = val.days.map(d => String(d).toLowerCase())
      
      const hasSubmitted = lowerDays.some(d => 
        d.startsWith("submitted") || 
        d.includes("target met") || 
        d.includes("equal hours") ||
        d === "less_hours" ||
        d === "more_hours" ||
        d === "equal_hours" ||
        d === "submitted"
      )

      if (hasSubmitted) {
        finalStatus = "submitted"
      } else if (lowerDays.includes("rejected")) {
        finalStatus = "rejected"
      } else if (lowerDays.length > 0 && lowerDays.every(d => d === "approved" || d === "holiday" || d === "weekend")) {
        finalStatus = "approved"
      }
      
      finalWeekSummaries[key] = { totalMinutes: val.totalMinutes, status: finalStatus }
    }


    // Extract dynamic legend from data
    const statusMap = new Map<string, string>()
    rawData.forEach((d: any) => {
      if (d.status && d.color) {
        const s = String(d.status).toLowerCase()
        if (!statusMap.has(s)) {
          statusMap.set(s, d.color)
        }
      }
    })

    const dynamicLegend = Array.from(statusMap.entries()).map(([status, color]) => {
      // Map raw status to friendly labels if needed, or just capitalize
      let label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
      if (status === "approved_time_entry") label = "Approved Time Entry"
      if (status === "less_hours" || status === "submittedless") label = "Less Hours"
      if (status === "more_hours" || status === "submittedexceed") label = "More Hours"
      if (status === "equal_hours" || status === "submitted") label = "Equal Hours"
      
      return { status, color, label }
    })

    return {
      dayStatuses: dayMap,
      weekSummaries: finalWeekSummaries,
      allocatedTotal,
      actualTotal,
      balanceTotal,
      legend: dynamicLegend
    }
  }, [monthLegendQuery.data, dateStr])

  // ── Actions ───────────────────────────────────────────────────────────────
  function selectEmployee(employee: MgtEmployeeRow) {
    setSelectedUserId(employee.id)
    setSelectedEmployee(employee)
    
    // Reset to today's date (LA time) so data is always fetched immediately for the new user
    const today = todayLocal()
    setSelectedDate(today)
  }

  function clearSelection() {
    setSelectedUserId(null)
    setSelectedEmployee(null)
    
    const today = todayLocal()
    setSelectedDate(today)
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  return {
    // State
    search,
    setSearch,
    selectedUserId,
    selectedEmployee,
    currentDate,
    setCurrentDate,
    selectedDate,
    setSelectedDate,
    month,
    year,

    // Data
    filteredEmployees,
    dayStatuses,
    weekSummaries,
    allocatedTotal: summaryQuery.data?.tsmins ?? allocatedTotal,
    actualTotal: summaryQuery.data?.actualnormalactivitytime ?? actualTotal,
    balanceTotal: summaryQuery.data?.actualnormalactivityTimebalance ?? balanceTotal,
    legend,
    dayDetail: dayDetailQuery.data,
    dropdownData: dropdownQuery.data,
    actualMultiTotal: summaryQuery.data?.actualmultiactivitytime,
    multiBalanceTotal: summaryQuery.data?.actualmultiactivityTimebalance,

    // Loading states
    isEmployeeListLoading: employeeListQuery.isLoading,
    isMonthLegendLoading:  monthLegendQuery.isLoading,
    isDayDetailLoading:    dayDetailQuery.isLoading,

    // Actions
    selectEmployee,
    clearSelection,
  }
}
