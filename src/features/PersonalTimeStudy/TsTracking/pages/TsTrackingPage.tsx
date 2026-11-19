import { useMemo } from "react"
import { Bell, CheckCircle, Clock, AlertCircle, Eye, Search, X } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MasterCodePagination } from "@/features/master-code/components/MasterCodePagination"
import { useActionUserTimeRecord } from "@/features/PersonalTimeStudy/TimeStudyMGT/mutations/updateActionUserTimeRecord"
import { buildNearbyCalendarYears, toIsoYmdFromDate } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { useTsTracking } from "../hooks/useTsTracking"
import type { TsTrackingPageProps, TsTrackingRow, TsTrackingStatus, TsTrackingStatusFilter } from "../types"

const STATUS_META: Record<
  TsTrackingStatus,
  { label: string; badgeClass: string; accent: string; icon: typeof CheckCircle }
> = {
  approved: {
    label: "Approved",
    badgeClass: "bg-[#22c55e]/15 text-[#16a34a]",
    accent: "#16a34a",
    icon: CheckCircle,
  },
  submitted: {
    label: "Awaiting Approval",
    badgeClass: "bg-[#f59e0b]/15 text-[#d97706]",
    accent: "#d97706",
    icon: Clock,
  },
  draft: {
    label: "Not Submitted",
    badgeClass: "bg-[#ef4444]/15 text-[#dc2626]",
    accent: "#dc2626",
    icon: AlertCircle,
  },
}

function weekRangeFromDate(dateStr: string): { startDate: string; endDate: string } | null {
  const dateObj = new Date(dateStr)
  if (Number.isNaN(dateObj.getTime())) return null
  const day = dateObj.getDay()
  const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1)
  const start = new Date(dateObj)
  start.setDate(diff)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return { startDate: toIsoYmdFromDate(start), endDate: toIsoYmdFromDate(end) }
}

export function TsTrackingPage({ onOpenInMgt }: TsTrackingPageProps) {
  const {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    month,
    setMonth,
    year,
    setYear,
    quarter,
    setQuarter,
    page,
    setPage,
    pageSize,
    setPageSize,
    counts,
    rows,
    totalItems,
    isLoading,
  } = useTsTracking(true)

  const { mutate: notifyUser, isPending: isNotifyPending } = useActionUserTimeRecord()
  const yearOptions = useMemo(() => buildNearbyCalendarYears(), [])

  function handleOpen(row: TsTrackingRow): void {
    onOpenInMgt({
      userId: row.id,
      date: row.date,
      status: row.status,
    })
  }

  function handleNotify(row: TsTrackingRow): void {
    if (!row.date) {
      toast.error("No date available to notify for this user")
      return
    }
    const range = weekRangeFromDate(row.date)
    if (!range) {
      toast.error("Invalid date for notification")
      return
    }
    notifyUser({
      userId: row.id,
      startDate: range.startDate,
      endDate: range.endDate,
      status: "notify",
    })
  }

  const summaryCards: Array<{
    key: TsTrackingStatusFilter
    label: string
    count: number
    accent: string
    icon: typeof CheckCircle
  }> = [
    { key: "all", label: "All", count: counts.submitted + counts.draft + counts.approved, accent: "#6C5DD3", icon: Eye },
    { key: "submitted", label: "Awaiting Approval", count: counts.submitted, accent: STATUS_META.submitted.accent, icon: STATUS_META.submitted.icon },
    { key: "draft", label: "Not Submitted", count: counts.draft, accent: STATUS_META.draft.accent, icon: STATUS_META.draft.icon },
    { key: "approved", label: "Approved", count: counts.approved, accent: STATUS_META.approved.accent, icon: STATUS_META.approved.icon },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-[17px] font-semibold tracking-[-0.374px] text-[#1d1d1f]">
          TS Tracking at a Glance
        </h2>
        <p className="text-[13px] text-[#7a7a7a]">
          See each user&apos;s time-study progress. Click a status or View to open Time Study MGT for that period.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger size="sm" className="h-8 w-[110px] text-[12px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All months</SelectItem>
              <SelectItem value="1">Jan</SelectItem>
              <SelectItem value="2">Feb</SelectItem>
              <SelectItem value="3">Mar</SelectItem>
              <SelectItem value="4">Apr</SelectItem>
              <SelectItem value="5">May</SelectItem>
              <SelectItem value="6">Jun</SelectItem>
              <SelectItem value="7">Jul</SelectItem>
              <SelectItem value="8">Aug</SelectItem>
              <SelectItem value="9">Sep</SelectItem>
              <SelectItem value="10">Oct</SelectItem>
              <SelectItem value="11">Nov</SelectItem>
              <SelectItem value="12">Dec</SelectItem>
            </SelectContent>
          </Select>

          <Select value={year} onValueChange={setYear}>
            <SelectTrigger size="sm" className="h-8 w-[100px] text-[12px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger size="sm" className="h-8 w-[100px] text-[12px]">
              <SelectValue placeholder="Quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Quarter</SelectItem>
              <SelectItem value="q1">Q1</SelectItem>
              <SelectItem value="q2">Q2</SelectItem>
              <SelectItem value="q3">Q3</SelectItem>
              <SelectItem value="q4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="relative w-full sm:w-[240px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9ca3af]" />
          <input
            type="text"
            placeholder="Search user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-full rounded-lg border border-[#e5e7eb] bg-white pl-8 pr-7 text-[12px] text-[#111827] placeholder:text-[#9ca3af] focus:border-[#6C5DD3] focus:outline-none focus:ring-1 focus:ring-[#6C5DD3]/20"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Summary chips — clickable filters */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          const active = statusFilter === card.key
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setStatusFilter(card.key)}
              className={cn(
                "flex items-center gap-3 rounded-[10px] border px-3 py-3 text-left transition-all",
                active
                  ? "border-transparent shadow-sm"
                  : "border-[#eef0f5] bg-white hover:border-[#d8dbe7]",
              )}
              style={
                active
                  ? { backgroundColor: `${card.accent}12`, borderColor: `${card.accent}40` }
                  : undefined
              }
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${card.accent}18`, color: card.accent }}
              >
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-medium text-[#7a7a7a]">{card.label}</span>
                <span className="block text-[20px] font-semibold tracking-tight text-[#1d1d1f]">
                  {card.count}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Table — purple header matches Time Study MGT employee table */}
      <div className="overflow-hidden rounded-[6px] bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)]">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-0 bg-[#6C5DD3] hover:bg-[#6C5DD3]">
                <TableHead className="h-[52px] px-4 text-[13px] font-normal text-white">Employee</TableHead>
                <TableHead className="h-[52px] px-4 text-[13px] font-normal text-white">Department</TableHead>
                <TableHead className="h-[52px] px-4 text-[13px] font-normal text-white">Period</TableHead>
                <TableHead className="h-[52px] px-4 text-[13px] font-normal text-white">Status</TableHead>
                <TableHead className="h-[52px] px-4 text-center text-[13px] font-normal text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <Spinner className="mx-auto size-6 text-[#6C5DD3]" />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-[13px] text-gray-500">
                    No time-study progress found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => {
                  const meta = STATUS_META[row.status]
                  return (
                    <TableRow
                      key={`${row.id}-${row.status}-${row.date ?? ""}`}
                      className="border-gray-200 hover:bg-gray-50"
                    >
                      <TableCell className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => handleOpen(row)}
                          className="text-left text-[14px] text-gray-700 hover:font-semibold hover:text-[#6B4EFF]"
                        >
                          {row.name}
                        </button>
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-[14px] text-gray-700">
                        {row.department || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5 text-[14px] text-gray-700 whitespace-nowrap">
                        {row.date || "—"}
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => handleOpen(row)}
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80",
                            meta.badgeClass,
                          )}
                          title={`Open ${meta.label} in Time Study MGT`}
                        >
                          {meta.label}
                        </button>
                      </TableCell>
                      <TableCell className="px-4 py-2.5">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="Open in Time Study MGT"
                            onClick={() => handleOpen(row)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#6C5DD3] transition-all hover:border-[#6C5DD3] hover:bg-[#6C5DD3] hover:text-white"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {row.status === "draft" ? (
                            <button
                              type="button"
                              title="Send notification"
                              disabled={isNotifyPending || !row.date}
                              onClick={() => handleNotify(row)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-[#d97706] transition-all hover:border-[#d97706] hover:bg-[#d97706] hover:text-white disabled:opacity-40"
                            >
                              <Bell className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {totalItems > 0 ? (
          <div className="border-t border-gray-200 px-3 py-2">
            <MasterCodePagination
              totalItems={totalItems}
              currentPage={page}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
