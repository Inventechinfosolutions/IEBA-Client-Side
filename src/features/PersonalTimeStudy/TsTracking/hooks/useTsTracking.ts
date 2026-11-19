import { useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
import { useDashboardStatusUsers } from "@/features/dashboard/queries/dashboardQueries"
import type { TsTrackingRow, TsTrackingStatus, TsTrackingStatusFilter } from "../types"

const STATUS_PRIORITY: Record<TsTrackingStatus, number> = {
  submitted: 0,
  draft: 1,
  approved: 2,
}

function currentMonthYear(): { month: string; year: string } {
  const now = new Date()
  return {
    month: String(now.getMonth() + 1),
    year: String(now.getFullYear()),
  }
}

/**
 * At-a-glance time-study progress for supervisors/admins.
 * Reuses dashboard status-users endpoints and merges into one actionable list.
 */
export function useTsTracking(enabled: boolean) {
  const { user } = useAuth()
  const { isSuperAdmin, isClientAdmin } = usePermissions()
  const defaults = currentMonthYear()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<TsTrackingStatusFilter>("all")
  const [month, setMonth] = useState(defaults.month)
  const [year, setYear] = useState(defaults.year)
  const [quarter, setQuarter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Supervisors see reportees via their userId; county admins see all.
  const scopeUserId = isSuperAdmin || isClientAdmin ? undefined : user?.id

  const filterParams = {
    userId: scopeUserId,
    month: month === "all" ? undefined : month,
    year: year === "all" ? undefined : year,
    quarter: quarter === "all" ? undefined : quarter,
    search: search.trim() || undefined,
  }

  const countParams = {
    ...filterParams,
    search: undefined,
    page: 1,
    limit: 1,
  }

  const approvedCountQ = useDashboardStatusUsers({
    ...countParams,
    status: "approved",
    enabled,
  })
  const pendingCountQ = useDashboardStatusUsers({
    ...countParams,
    status: "submitted",
    enabled,
  })
  const draftCountQ = useDashboardStatusUsers({
    ...countParams,
    status: "draft",
    enabled,
  })

  const singleStatus = statusFilter === "all" ? null : statusFilter
  const singlePageQ = useDashboardStatusUsers({
    ...filterParams,
    status: singleStatus ?? "submitted",
    page,
    limit: pageSize,
    enabled: enabled && singleStatus !== null,
  })

  // For "all", pull a larger window per status and merge client-side.
  const mergeLimit = 200
  const approvedAllQ = useDashboardStatusUsers({
    ...filterParams,
    status: "approved",
    page: 1,
    limit: mergeLimit,
    enabled: enabled && statusFilter === "all",
  })
  const pendingAllQ = useDashboardStatusUsers({
    ...filterParams,
    status: "submitted",
    page: 1,
    limit: mergeLimit,
    enabled: enabled && statusFilter === "all",
  })
  const draftAllQ = useDashboardStatusUsers({
    ...filterParams,
    status: "draft",
    page: 1,
    limit: mergeLimit,
    enabled: enabled && statusFilter === "all",
  })

  const counts = {
    approved: approvedCountQ.data?.meta?.totalItems ?? 0,
    submitted: pendingCountQ.data?.meta?.totalItems ?? 0,
    draft: draftCountQ.data?.meta?.totalItems ?? 0,
  }

  const mergedRows = useMemo((): TsTrackingRow[] => {
    if (statusFilter !== "all") {
      return (singlePageQ.data?.data ?? []).map((u) => ({
        id: String(u.id),
        name: u.name,
        department: u.department || "",
        date: u.date,
        status: statusFilter,
      }))
    }

    const byUser = new Map<string, TsTrackingRow>()
    const ingest = (
      status: TsTrackingStatus,
      list: Array<{ id: string | number; name: string; department: string; date?: string }> | undefined,
    ): void => {
      for (const u of list ?? []) {
        const id = String(u.id)
        const next: TsTrackingRow = {
          id,
          name: u.name,
          department: u.department || "",
          date: u.date,
          status,
        }
        const prev = byUser.get(id)
        if (!prev || STATUS_PRIORITY[status] < STATUS_PRIORITY[prev.status]) {
          byUser.set(id, next)
        }
      }
    }

    ingest("submitted", pendingAllQ.data?.data)
    ingest("draft", draftAllQ.data?.data)
    ingest("approved", approvedAllQ.data?.data)

    return [...byUser.values()].sort((a, b) => {
      const p = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
      if (p !== 0) return p
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
    })
  }, [
    statusFilter,
    singlePageQ.data,
    pendingAllQ.data,
    draftAllQ.data,
    approvedAllQ.data,
  ])

  const { rows, totalItems } = useMemo(() => {
    if (statusFilter !== "all") {
      return {
        rows: mergedRows,
        totalItems: singlePageQ.data?.meta?.totalItems ?? mergedRows.length,
      }
    }
    const start = (page - 1) * pageSize
    return {
      rows: mergedRows.slice(start, start + pageSize),
      totalItems: mergedRows.length,
    }
  }, [mergedRows, statusFilter, page, pageSize, singlePageQ.data])

  const isLoading =
    approvedCountQ.isLoading ||
    pendingCountQ.isLoading ||
    draftCountQ.isLoading ||
    (statusFilter === "all"
      ? approvedAllQ.isLoading || pendingAllQ.isLoading || draftAllQ.isLoading
      : singlePageQ.isLoading)

  function updateStatusFilter(next: TsTrackingStatusFilter): void {
    setStatusFilter(next)
    setPage(1)
  }

  function updateSearch(next: string): void {
    setSearch(next)
    setPage(1)
  }

  function updateMonth(next: string): void {
    setMonth(next)
    if (next !== "all") setQuarter("all")
    setPage(1)
  }

  function updateYear(next: string): void {
    setYear(next)
    setPage(1)
  }

  function updateQuarter(next: string): void {
    setQuarter(next)
    if (next !== "all") setMonth("all")
    setPage(1)
  }

  return {
    search,
    setSearch: updateSearch,
    statusFilter,
    setStatusFilter: updateStatusFilter,
    month,
    setMonth: updateMonth,
    year,
    setYear: updateYear,
    quarter,
    setQuarter: updateQuarter,
    page,
    setPage,
    pageSize,
    setPageSize: (size: number) => {
      setPageSize(size)
      setPage(1)
    },
    counts,
    rows,
    totalItems,
    isLoading,
  }
}
