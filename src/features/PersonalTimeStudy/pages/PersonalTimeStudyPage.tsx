import { useMemo, useState } from "react"
import { X, Lock, Check } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { useAuth } from "@/contexts/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
import { PersonalTimeStudyCalendarCard } from "../components/PersonalTimeStudyCalendarCard"
import { PersonalTimeStudyEntryForm } from "../components/PersonalTimeStudyEntryForm"
import { PersonalTimeStudyLeaveCard } from "../components/PersonalTimeStudyLeaveCard"
import { PersonalTimeStudyLegendCard } from "../components/PersonalTimeStudyLegendCard"
import { PersonalTimeStudyMinutesCard } from "../components/PersonalTimeStudyMinutesCard"
import { PersonalTimeStudyNotesSection } from "../components/PersonalTimeStudyNotesSection"
import { useGetPersonalMonthLegend } from "../queries/getPersonalMonthLegend"
import { useGetPersonalDayDetail } from "../queries/getPersonalDayDetail"
import { useGetPersonalDropdowns } from "../queries/getPersonalDropdowns"
import { useGetTimeEntrySummary } from "../queries/getTimeEntrySummary"
import { useGetUserApportioningConfig } from "../queries/getUserApportioningConfig"
import { useSavePersonalNotes } from "../mutation/updatePersonalNotes"
import { useSubmitPersonalTimeRecords } from "../mutation/createPersonalTimeRecords"
import { useDeletePersonalTimeRecord } from "../mutation/deletePersonalTimeRecord"
import type { WeekSummaryRow } from "../components/PersonalTimeStudyWeekSummary"
import { TimeStudyMGTPage } from "../TimeStudyMGT"

type ActiveTab = "personal" | "mgt"

function getWeekStartKey(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00Z')
  const day = date.getUTCDay()
  const diff = date.getUTCDate() - day
  const sunday = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), diff))
  const y = sunday.getUTCFullYear()
  const m = String(sunday.getUTCMonth() + 1).padStart(2, '0')
  const d = String(sunday.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Determines the overall status for a week based on individual day statuses and totals.
 * Priority: 
 * 1. All Approved -> "approved"
 * 2. Any Rejected -> "rejected"
 * 3. Any Not Submitted -> "pending"
 * 4. All Submitted -> Compare Total vs Target (equal, less, more)
 */
function getWeeklyStatus(days: string[], totalMinutes: number, targetMinutes: number): string {
  if (days.length === 0) return "notsubmitted"

  const lowerDays = days.map(d => String(d || "").toLowerCase())
  
  // 1. Check if everything is approved
  const allApproved = lowerDays.every(d => d === "approved")
  if (allApproved) return "approved"

  // 2. Check if there is any rejection
  const hasRejected = lowerDays.some(d => d === "rejected")
  if (hasRejected) return "rejected"

  // 3. Check if any working day is not submitted
  // "opened" or empty string or "notsubmitted" count as pending
  const hasNotSubmitted = lowerDays.some(d => !d || d === "opened" || d === "notsubmitted" || d === "undefined")
  if (hasNotSubmitted) return "pending"

  // 4. Everything is submitted (or approved/rejected mix without pending)
  // Calculate based on totals
  if (totalMinutes === targetMinutes) return "equal"
  if (totalMinutes < targetMinutes) return "less"
  return "more"
}

export function PersonalTimeStudyPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ""

  
  const { canReview } = usePermissions()
  const canReviewMgt = canReview("timestudysupervisor")

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("personal")

  // 1. Date state
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date()
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  })

  // Separate viewport state for the calendar (to avoid changing selection on month navigation)
  const [viewportDate, setViewportDate] = useState<Date>(selectedDate)

  const dateStr = selectedDate.toISOString().split("T")[0]
  const month = viewportDate.getUTCMonth() + 1
  const year = viewportDate.getUTCFullYear()

  const handleMonthChange = (newViewport: Date) => {
    setViewportDate(newViewport)
    // Auto-select the 1st of the new month if current selection is in a different month/year
    if (
      selectedDate.getUTCMonth() !== newViewport.getUTCMonth() ||
      selectedDate.getUTCFullYear() !== newViewport.getUTCFullYear()
    ) {
      const firstOfMonth = new Date(Date.UTC(newViewport.getUTCFullYear(), newViewport.getUTCMonth(), 1))
      setSelectedDate(firstOfMonth)
    }
  }

  // 2. Fetch Month Legend
  const monthQuery = useGetPersonalMonthLegend(userId, month, year, activeTab === "personal")

  // 3. Fetch Day Detail
  const dayQuery = useGetPersonalDayDetail(userId, dateStr, selectedDate.getUTCMonth() + 1, selectedDate.getUTCFullYear(), activeTab === "personal")

  // 4. Fetch user & dropdown data
  const dropdownQuery = useGetPersonalDropdowns(userId, activeTab === "personal")

  // 5. Fetch Time Entry Summary (MAA etc)
  const summaryQuery = useGetTimeEntrySummary(userId, dateStr, undefined, activeTab === "personal")

  // -- Personal Time Study: apportioning config for supervisor panel (read-only) --
  const apportioningConfigQuery = useGetUserApportioningConfig(userId, activeTab === "personal")

  // 5. Calendar day & week summaries
  const { dayStatuses, weekSummaries } = useMemo(() => {
    const dayMap: Record<string, { status: string; color?: string; hasNotes?: boolean; noteText?: string }> = {}
    const weekMap: Record<string, { totalMinutes: number, targetMinutes: number, days: string[] }> = {}

    if (!monthQuery.data?.data) return { dayStatuses: {}, weekSummaries: {} }

    for (const d of monthQuery.data.data) {
      const s = String(d.status).toLowerCase()
      // If unlocked (opened), don't show the cell color
      const cellColor = s === "opened" ? undefined : (d.color ?? undefined)
      dayMap[d.date] = { status: d.status, color: cellColor, hasNotes: !!d.notes, noteText: d.notes || undefined }
      
      const weekKey = getWeekStartKey(d.date)
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { totalMinutes: 0, targetMinutes: 0, days: [] }
      }

      weekMap[weekKey].totalMinutes += (d.minutes ?? 0) + (d.leaveMinutes ?? 0)
      weekMap[weekKey].targetMinutes += d.allocatedMinutes ?? 0
      weekMap[weekKey].days.push(d.status)
    }

    // Find the baseline daily assigned minutes from the DB (first day that has a non-zero value)
    const dbAssignedMinutes = monthQuery.data.data.find(d => (d.allocatedMinutes ?? 0) > 0)?.allocatedMinutes ?? 0

    const weekSummaries: Record<string, any> = {}
    for (const [key, val] of Object.entries(weekMap)) {
      // Weekly target is strictly 7 * the assigned daily minutes from the DB
      const weeklyTarget = 7 * dbAssignedMinutes
      
      const finalStatus = getWeeklyStatus(val.days, val.totalMinutes, weeklyTarget)
      weekSummaries[key] = { totalMinutes: val.totalMinutes, status: finalStatus }
    }

    // Extract dynamic legend from data
    const statusMap = new Map<string, string>()
    monthQuery.data.data.forEach((d: any) => {
      if (d.status && d.color) {
        const s = String(d.status).toLowerCase()
        if (!statusMap.has(s)) {
          statusMap.set(s, d.color)
        }
      }
    })

    const dynamicLegend = Array.from(statusMap.entries()).map(([status, color]) => {
      let label = status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ")
      if (status === "approved_time_entry") label = "Approved Time Entry"
      if (status === "less_hours" || status === "submittedless") label = "Less Hours"
      if (status === "more_hours" || status === "submittedexceed") label = "More Hours"
      if (status === "equal_hours" || status === "submitted") label = "Equal Hours"
      return { status, color, label }
    })

    return { dayStatuses: dayMap, weekSummaries, legend: dynamicLegend }
  }, [monthQuery.data])

  const renderStatus = (_weekIndex: number, _dates: Date[], status: any) => {
    const s = String(status).toLowerCase()
    
    // 1. Approved (Lock Icon)
    if (s === "approved") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <Lock className="size-4 text-gray-500 shrink-0 cursor-help" aria-hidden />
          </TooltipTrigger>
          <TooltipContent className="text-xs">Approved</TooltipContent>
        </Tooltip>
      )
    }

    // 2. Rejected (Red X)
    if (s === "rejected") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-white border border-[#DC3545] shrink-0 cursor-help shadow-sm">
              <X className="size-2.5 text-[#DC3545]" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Rejected</TooltipContent>
        </Tooltip>
      )
    }

    // 3. Pending (Orange X)
    if (s === "pending") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-white border border-[#F97316] shrink-0 cursor-help shadow-sm">
              <X className="size-2.5 text-[#F97316]" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Time sheet pending</TooltipContent>
        </Tooltip>
      )
    }

    // 4. Equal (Green Check)
    if (s === "equal") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#28A745] shrink-0 cursor-help shadow-sm">
              <Check className="size-2.5 text-white" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Equal Hours</TooltipContent>
        </Tooltip>
      )
    }

    // 5. Less (Yellow Alert)
    if (s === "less") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#FFC107] shrink-0 cursor-help shadow-sm">
              <Check className="size-2.5 text-white" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Less Hours</TooltipContent>
        </Tooltip>
      )
    }

    // 6. More (Red Alert)
    if (s === "more") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#DC3545] shrink-0 cursor-help shadow-sm">
              <Check className="size-2.5 text-white" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">More Hours</TooltipContent>
        </Tooltip>
      )
    }

    return null
  }

  // 6. Notes local state
  const [localNotes, setLocalNotes] = useState("")

  // Sync local notes when date changes or data arrives
  const fetchedNotes = dayQuery.data?.notes ?? ""
  const [prevFetchedNotes, setPrevFetchedNotes] = useState<string | null>(null)
  const [prevDateStr, setPrevDateStr] = useState(dateStr)

  if (dateStr !== prevDateStr) {
    setPrevDateStr(dateStr)
    setLocalNotes("") // Clear notes immediately when date changes
    setPrevFetchedNotes(null)
  } else if (fetchedNotes !== prevFetchedNotes && dayQuery.isSuccess) {
    setPrevFetchedNotes(fetchedNotes)
    setLocalNotes(fetchedNotes)
  }

  // 7. Mutations
  const notesMutation = useSavePersonalNotes(userId, dateStr, month, year)
  const submitMutation = useSubmitPersonalTimeRecords(userId, dateStr, month, year)
  const deleteMutation = useDeletePersonalTimeRecord(userId, dateStr, month, year)

  const weekRows: WeekSummaryRow[] = useMemo(() => [], [])

  return (
    <TooltipProvider>
    <section className="font-roboto *:font-roboto box-border w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="box-border w-full min-w-0 max-w-full px-6 py-4">

      {/* ── Outer card wrapping BOTH tabs — same as Payroll page ── */}
      <div className="box-border mx-auto min-w-0 w-full max-w-full overflow-hidden rounded-[6px] border border-[#e7e9f2] bg-white shadow-[0_0_14px_0_rgb(0_0_0/0.04),0_0_1px_0_rgb(0_0_0/0.06)]">

        {/* Tab Bar — Program-style design */}
        <div className="border-b border-[#eef0f5]">
          <div className={cn("grid select-none gap-0 bg-white", canReviewMgt ? "grid-cols-2" : "grid-cols-1")}>
            <button
              id="tab-personal-time-study"
              type="button"
              onClick={() => setActiveTab("personal")}
              className={cn(
                "flex h-[63px] cursor-pointer items-center justify-center rounded-[6px] border px-3 text-[17px] leading-none font-medium tracking-wide",
                activeTab === "personal"
                  ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                  : "border-[#e8e9ef] bg-white text-[#6C5DD3]"
              )}
            >
              Personal Time Study
            </button>
            {canReviewMgt && (
              <button
                id="tab-time-study-mgt"
                type="button"
                onClick={() => setActiveTab("mgt")}
                className={cn(
                  "flex h-[63px] cursor-pointer items-center justify-center rounded-[6px] border px-3 text-[17px] leading-none font-medium tracking-wide",
                  activeTab === "mgt"
                    ? "border-[#6C5DD3] bg-[#6C5DD3] text-white"
                    : "border-[#e8e9ef] bg-white text-[#6C5DD3]"
                )}
              >
                Time Study MGT
              </button>
            )}
          </div>
        </div>

        {/* Tab Content — padded inside the card */}
        <div className="p-4 lg:p-6">

          {/* ── Personal Time Study Tab ── */}
          {activeTab === "personal" && (
            <>
              <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch lg:gap-2">
                <div className="flex min-h-0 min-w-0 shrink-0 lg:w-[38%] lg:max-w-[38%]">
                  <PersonalTimeStudyCalendarCard
                    weekRows={weekRows}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    currentMonthDate={viewportDate}
                    onMonthChange={handleMonthChange}
                    dayStatuses={dayStatuses}
                    weekSummaries={weekSummaries}
                    renderStatus={renderStatus}
                    className="h-full min-h-0 w-full min-w-0"
                  />
                </div>

                <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 lg:min-h-0">
                  <div className="grid min-h-0 w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <PersonalTimeStudyLegendCard className="min-h-0" />
                    <PersonalTimeStudyLeaveCard
                      className="min-h-0"
                      leaveCount={
                        (monthQuery.data?.leaveRecords?.filter(r => r.status?.toLowerCase() === "approved").length ?? 0) +
                        (monthQuery.data?.leaveRecords?.filter(r => ["draft", "requested"].includes(r.status?.toLowerCase() ?? "")).length ?? 0) +
                        (monthQuery.data?.leaveRecords?.filter(r => r.status?.toLowerCase() === "rejected").length ?? 0)
                      }
                      approved={monthQuery.data?.leaveRecords?.filter(r => r.status?.toLowerCase() === "approved").length ?? 0}
                      open={monthQuery.data?.leaveRecords?.filter(r => ["draft", "requested"].includes(r.status?.toLowerCase() ?? "")).length ?? 0}
                      rejected={monthQuery.data?.leaveRecords?.filter(r => r.status?.toLowerCase() === "rejected").length ?? 0}
                      leaveRecords={monthQuery.data?.leaveRecords}
                      dropdownData={dropdownQuery.data}
                      onOpen={() => dropdownQuery.refetch()}
                      dateStr={dateStr}
                      month={month}
                      year={year}
                    />
                    <PersonalTimeStudyMinutesCard
                      className="min-h-0 sm:col-span-2 lg:col-span-1"
                      allocatedMinutes={summaryQuery.data?.tsmins ?? 0}
                      actualMinutes={summaryQuery.data?.actualnormalactivitytime ?? 0}
                      balanceMinutes={summaryQuery.data?.actualnormalactivityTimebalance ?? 0}
                      totalMAAMinutes={summaryQuery.data?.actualmultiactivitytime ?? 0}
                    />
                  </div>

                  <PersonalTimeStudyNotesSection
                    value={localNotes}
                    onChange={setLocalNotes}
                    onSave={() => notesMutation.mutate(localNotes)}
                    className="min-h-0"
                  />
                </div>
              </div>

              <div className="mt-6 mb-4">
                <PersonalTimeStudyEntryForm
                    key={dateStr}
                    dateStr={dateStr}                    initialRecords={dayQuery.data?.timeStudyRecords}
                    dropdownData={dropdownQuery.data}
                    leaveRecords={dayQuery.data?.leaveRecords}
                    onSave={(records) => submitMutation.mutate({ records, mode: "save" })}
                    onSubmit={(records) => submitMutation.mutate({ records, mode: "submit" })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    allocatedTotal={summaryQuery.data?.tsmins}
                    actualTotal={summaryQuery.data?.actualnormalactivitytime}
                    balanceTotal={summaryQuery.data?.actualnormalactivityTimebalance}
                    actualMultiTotal={summaryQuery.data?.actualmultiactivitytime}
                    multiBalanceTotal={summaryQuery.data?.actualmultiactivityTimebalance}
                    hideSummaryHeader={true}
                    apportioningConfig={apportioningConfigQuery.data ?? null}
                  />
              </div>
            </>
          )}

          {/* ── Time Study MGT Tab ── */}
          {activeTab === "mgt" && canReviewMgt && (
            <TimeStudyMGTPage />
          )}

        </div>
      </div>
      </div>
    </section>
    </TooltipProvider>
  )
}
