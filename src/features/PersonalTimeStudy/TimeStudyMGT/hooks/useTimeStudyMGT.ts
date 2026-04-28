import { useMemo, useState } from "react"
import { useGetMGTEmployeeList } from "../queries/useGetMGTEmployeeList"
import { useGetMGTMonthLegend } from "../queries/useGetMGTMonthLegend"
import type { MgtEmployeeRow } from "../types"

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

  const dayStatuses = monthLegendQuery.data ?? {}

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

    // Loading states
    isEmployeeListLoading: employeeListQuery.isLoading,
    isMonthLegendLoading:  monthLegendQuery.isLoading,

    // Actions
    selectEmployee,
    clearSelection,
  }
}
