import { useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { useGetMGTEmployeeList } from "../queries/getMGTEmployeeList"
import { useGetMGTMonthLegend } from "../queries/getMGTMonthLegend"
import { useGetMGTDayDetail } from "../queries/getMGTDayDetail"
import { getCalendarWeekStartKeyFromIso } from "@/components/Calender"
import { toIsoYmdFromDate, todayLocal } from "@/lib/dates"
import { usePermissions } from "@/hooks/usePermissions"
import type { MgtEmployeeRow, MgtDayStatusMap, MgtWeekSummary } from "../types"
import { useGetUserAssignedDepartmentsSettingChecks } from "../../queries/getUserAssignedDepartmentsSettingChecks"

/** Derive week STATUS/ACTION from backend monthlegend day statuses (any single day qualifies). */
function resolveWeekStatusFromBackendDays(days: string[]): string {
  const lowerDays = days.map((d) => String(d || "").toLowerCase())

  if (lowerDays.some((d) => d === "approved")) {
    return "approved"
  }
  if (
    lowerDays.some(
      (d) =>
        d.startsWith("submitted") ||
        d.includes("target met") ||
        d.includes("equal hours") ||
        d === "less_hours" ||
        d === "more_hours" ||
        d === "equal_hours" ||
        d === "submitted",
    )
  ) {
    return "submitted"
  }
  if (lowerDays.some((d) => d === "rejected")) {
    return "rejected"
  }
  return "notsubmitted"
}

/**
 * Master UI state hook for the Time Study MGT tab.
 * Encapsulates: employee selection, month navigation, search, and data fetching.
 */
export function useTimeStudyMGT() {
  const location = useLocation()
  const initialUserId = (location.state && typeof location.state === "object" && "userId" in location.state)
    ? (location.state.userId as string)
    : null

  const initialDateStr = (location.state && typeof location.state === "object" && "date" in location.state)
    ? (location.state.date as string)
    : null

  const parsedInitialDate = initialDateStr ? new Date(initialDateStr) : null;
  const validInitialDate = parsedInitialDate && !isNaN(parsedInitialDate.getTime()) ? parsedInitialDate : todayLocal();

  const [search, setSearch]                           = useState("")
  const [selectedUserId, setSelectedUserId]           = useState<string | null>(initialUserId)
  const [selectedEmployee, setSelectedEmployee]       = useState<MgtEmployeeRow | null>(null)
  const [currentDate, setCurrentDate] = useState(() => {
    return new Date(validInitialDate.getFullYear(), validInitialDate.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState<Date | null>(validInitialDate)

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
  // dropdownQuery removed: MGT form is read-only, programs-activities not needed
  // summaryQuery removed: allocated/actual totals come from monthlegend data

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
      const weekKey = getCalendarWeekStartKeyFromIso(d.date)
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { totalMinutes: 0, status: "notsubmitted", days: [] }
      }
      weekMap[weekKey].totalMinutes += d.minutes ?? 0
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

    // Week status comes from backend day statuses — one qualifying day in the row is enough.
    const finalWeekSummaries: Record<string, MgtWeekSummary> = {}
    for (const [key, val] of Object.entries(weekMap)) {
      finalWeekSummaries[key] = {
        totalMinutes: val.totalMinutes,
        status: resolveWeekStatusFromBackendDays(val.days),
      }
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

  // ── Apportioning config for selected user/date ───────────────────────────
  const apportioningConfigQuery = useGetUserAssignedDepartmentsSettingChecks(
    selectedUserId ?? "",
    dateStr ?? "",
    !!selectedUserId && !!dateStr,
  )

  // Filter apportioning records from dayDetail
  const apportioningRecords = useMemo(() => {
    const records = dayDetailQuery.data?.timeStudyRecords ?? []
    return records.filter((r: any) => r.apportioning === true)
  }, [dayDetailQuery.data])

  const activeEmployee = useMemo(() => {
    if (selectedEmployee) return selectedEmployee
    if (!selectedUserId) return null
    return employees.find(e => String(e.id) === String(selectedUserId)) || null
  }, [selectedEmployee, selectedUserId, employees])

  return {
    // State
    search,
    setSearch,
    selectedUserId,
    selectedEmployee: activeEmployee,
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
    allocatedTotal,
    actualTotal,
    balanceTotal,
    legend,
    dayDetail: dayDetailQuery.data,
    dropdownData: undefined,
    actualMultiTotal: dayDetailQuery.data?.enteredMaaMinutes,
    multiBalanceTotal: dayDetailQuery.data?.maaBalance,
    apportioningConfig: apportioningConfigQuery.data,
    apportioningRecords,
    refetchConfig: apportioningConfigQuery.refetch,

    // Loading states
    isEmployeeListLoading: employeeListQuery.isLoading,
    isMonthLegendLoading:  monthLegendQuery.isLoading,
    isDayDetailLoading:    dayDetailQuery.isLoading,

    // Actions
    selectEmployee,
    clearSelection,
  }
}
