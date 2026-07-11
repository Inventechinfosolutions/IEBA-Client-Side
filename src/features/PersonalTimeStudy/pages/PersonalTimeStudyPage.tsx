import { useCallback, useMemo, useState } from "react"
import { useLocation } from "react-router-dom"
import { AlertTriangle } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { ApportioningDrawer } from "../components/ApportioningDrawer"

import { guardNoChanges } from "@/lib/formGuard"

import { useAuth } from "@/contexts/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
import { PersonalTimeStudyCalendarCard } from "../components/PersonalTimeStudyCalendarCard"
import { PersonalTimeStudyEntryForm } from "../components/PersonalTimeStudyEntryForm"
import { PersonalTimeStudyLeaveCard } from "../components/PersonalTimeStudyLeaveCard"
import { PersonalTimeStudyLegendCard } from "../components/PersonalTimeStudyLegendCard"
import { PersonalTimeStudyMinutesCard } from "../components/PersonalTimeStudyMinutesCard"
import { useGetPersonalMonthLegend } from "../queries/getPersonalMonthLegend"
import { useGetPersonalDayDetail } from "../queries/getPersonalDayDetail"
import { useGetPersonalDropdowns } from "../queries/getPersonalDropdowns"
import { apiGetUserProgramsAndActivitiesMulticode } from "../api/personalTimeStudyApi"
import { useGetTimeEntrySummary } from "../queries/getTimeEntrySummary"
import { useGetUserAssignedDepartmentsSettingChecks } from "../queries/getUserAssignedDepartmentsSettingChecks"
import { useSavePersonalNotes } from "../mutation/updatePersonalNotes"
import { useSubmitPersonalTimeRecords } from "../mutation/createPersonalTimeRecords"
import { useDeletePersonalTimeRecord } from "../mutation/deletePersonalTimeRecord"
import type { WeekSummaryRow } from "../components/PersonalTimeStudyWeekSummary"
import { TimeStudyMGTPage } from "../TimeStudyMGT"
import { PersonalTimeStudyNotesSection } from "../components/PersonalTimeStudyNotesSection"
import { PersonalTimeStudyPeriodsSection } from "../components/PersonalTimeStudyPeriodsSection"
import { toIsoYmdFromDate, todayLocal } from "@/lib/dates"
import { buildWeekSummariesFromMonthLegend } from "../utils/weekSummaryUtils"
import { WeekStatusIcon } from "../components/WeekStatusIcon"


type ActiveTab = "personal" | "mgt"

export function PersonalTimeStudyPage() {
  const { user } = useAuth()
  const userId = user?.id ?? ""
  const location = useLocation()


  const { canReview, isTimeStudySupervisor } = usePermissions()
  const canReviewMgt = canReview("timestudysupervisor")

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    if (location.state && typeof location.state === "object" && "tab" in location.state) {
      return (location.state.tab as ActiveTab) || "personal"
    }
    return "personal"
  })
  const [periodsSheetOpen, setPeriodsSheetOpen] = useState(false)

  // 1. Date state
  const [selectedDate, setSelectedDate] = useState<Date>(todayLocal)

  // Separate viewport state for the calendar (to avoid changing selection on month navigation)
  const [viewportDate, setViewportDate] = useState<Date>(selectedDate)

  const dateStr = toIsoYmdFromDate(selectedDate)
  const month = viewportDate.getMonth() + 1
  const year = viewportDate.getFullYear()

  const handleMonthChange = (newViewport: Date) => {
    setViewportDate(newViewport)
    // Auto-select the 1st of the new month if current selection is in a different month/year
    if (
      selectedDate.getMonth() !== newViewport.getMonth() ||
      selectedDate.getFullYear() !== newViewport.getFullYear()
    ) {
      const firstOfMonth = new Date(newViewport.getFullYear(), newViewport.getMonth(), 1)
      setSelectedDate(firstOfMonth)
    }
  }

  // 2. Fetch Month Legend
  const monthQuery = useGetPersonalMonthLegend(userId, month, year, activeTab === "personal")

  // 3. Fetch Day Detail
  const dayQuery = useGetPersonalDayDetail(userId, dateStr, selectedDate.getMonth() + 1, selectedDate.getFullYear(), activeTab === "personal")

  // 4. Fetch user & dropdown data — lazy load when clicked
  const [fetchDropdowns, setFetchDropdowns] = useState(false)
  const dropdownQuery = useGetPersonalDropdowns(userId, fetchDropdowns && activeTab === "personal" && !!userId)
  const handleOpenDropdown = () => {
    setFetchDropdowns(true)
    dropdownQuery.refetch()
  }

  // 4b. Multicode programs cache — lifted here so it survives date remounts (key={dateStr} on the form)
  const [departmentMulticodes, setDepartmentMulticodes] = useState<Record<string, any[]>>({})
  const [fetchingDepartments, setFetchingDepartments] = useState<Record<string, boolean>>({})

  const fetchMulticodeProgramsForDepartment = useCallback(async (deptIdStr: string | number | undefined) => {
    const deptId = String(deptIdStr || '').trim()
    if (!deptId || !userId) return
    setFetchingDepartments(prev => ({ ...prev, [deptId]: true }))
    try {
      const res = await apiGetUserProgramsAndActivitiesMulticode(userId, deptId)
      setDepartmentMulticodes(prev => ({ ...prev, [deptId]: res || [] }))
    } catch (err) {
      console.error(`Failed to fetch multicode programs for department ${deptId}`, err)
    } finally {
      setFetchingDepartments(prev => ({ ...prev, [deptId]: false }))
    }
  }, [userId])

  // 5. Fetch Time Entry Summary (MAA etc)
  const summaryQuery = useGetTimeEntrySummary(userId, dateStr, undefined, activeTab === "personal")

  // 6. Aggregated department setting checks for the user
  const settingChecksQuery = useGetUserAssignedDepartmentsSettingChecks(
    userId,
    dateStr,
    activeTab === "personal" && !!userId,
  )

  // 5. Calendar day & week summaries
  const { dayStatuses, weekSummaries } = useMemo(() => {
    const dayMap: Record<string, { status: string; color?: string; hasNotes?: boolean; noteText?: string }> = {}

    if (!monthQuery.data?.data) return { dayStatuses: {}, weekSummaries: {} }

    for (const d of monthQuery.data.data) {
      const s = String(d.status).toLowerCase()
      // If unlocked (opened) or draft, don't show the cell color
      const cellColor = (s === "opened" || s === "draft") ? undefined : (d.color ?? undefined)
      dayMap[d.date] = { status: d.status, color: cellColor, hasNotes: !!d.notes, noteText: d.notes || undefined }
    }

    const weekSummaries = buildWeekSummariesFromMonthLegend(monthQuery.data.data)

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

  const renderStatus = (_weekIndex: number, _dates: Date[], status: unknown) => (
    <WeekStatusIcon status={status} />
  )



  // 7. Mutations
  const submitMutation = useSubmitPersonalTimeRecords(userId, dateStr, month, year)
  const deleteMutation = useDeletePersonalTimeRecord(userId, dateStr, month, year)
  const notesMutation = useSavePersonalNotes(userId, dateStr, month, year)

  const [draftNotes, setDraftNotes] = useState<string | null>(null)
  const localNotes = useMemo(
    () => (draftNotes !== null ? draftNotes : dayQuery.data?.notes || ""),
    [draftNotes, dayQuery.data?.notes]
  )

  const weekRows: WeekSummaryRow[] = useMemo(() => [], [])

  return (
    <TooltipProvider>
      <section className="font-roboto *:font-roboto box-border w-full min-w-0 max-w-full overflow-x-hidden">
        <div className="box-border w-full min-w-0 max-w-full">

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
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-4">
                    <div className="min-w-0 shrink-0 lg:w-[40%] lg:max-w-[40%]">
                      <PersonalTimeStudyCalendarCard
                        weekRows={weekRows}
                        selectedDate={selectedDate}
                        onDateSelect={setSelectedDate}
                        currentMonthDate={viewportDate}
                        onMonthChange={handleMonthChange}
                        dayStatuses={dayStatuses}
                        weekSummaries={weekSummaries}
                        renderStatus={renderStatus}
                        className="w-full min-w-0"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="grid w-full grid-cols-1 items-stretch gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <PersonalTimeStudyLegendCard className="h-full" />
                        <PersonalTimeStudyLeaveCard
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
                          allowMultiCodes={settingChecksQuery.data?.allowMultiCodes === true}
                          onOpen={handleOpenDropdown}
                          dateStr={dateStr}
                          month={month}
                          year={year}
                          isLoading={monthQuery.isLoading}
                          isDropdownLoading={dropdownQuery.isFetching}
                        />
                        <PersonalTimeStudyMinutesCard
                          className="sm:col-span-2 lg:col-span-1 h-full"
                          allocatedMinutes={summaryQuery.data?.tsmins ?? 0}
                          actualMinutes={summaryQuery.data?.actualnormalactivitytime ?? 0}
                          balanceMinutes={summaryQuery.data?.actualnormalactivityTimebalance ?? 0}
                          totalMAAMinutes={summaryQuery.data?.actualmultiactivitytime}
                          apportioningSummary={summaryQuery.data?.apportioningSummary}
                          hideApportionedMinutes={isTimeStudySupervisor}
                        />
                      </div>

                      <div className={cn("grid gap-2 h-[180px]", isTimeStudySupervisor ? "grid-cols-[1fr_auto]" : "grid-cols-1 md:grid-cols-2")}>
                        <PersonalTimeStudyNotesSection
                          className="animate-in fade-in slide-in-from-right-12 duration-500 ease-out"
                          value={localNotes}
                          onChange={setDraftNotes}
                          onSave={() => {
                            const serverNotes = dayQuery.data?.notes || ""
                            if (guardNoChanges(localNotes, serverNotes)) return
                            notesMutation.mutate(localNotes, {
                              onSuccess: () => setDraftNotes(null)
                            })
                          }}
                          isSaving={notesMutation.isPending}
                          disabled={settingChecksQuery.data?.allowUserEntry === false}
                        />
                        {isTimeStudySupervisor ? (
                          <button
                            type="button"
                            onClick={() => setPeriodsSheetOpen(true)}
                            className="animate-in fade-in slide-in-from-right-12 duration-500 ease-out flex flex-col gap-2 h-full w-32 items-center justify-center rounded-[10px] bg-white text-[#6C5DD3] border border-gray-200 shadow-[0_4px_16px_rgba(16,24,40,0.12)] transition-colors hover:bg-gray-50 cursor-pointer p-3"
                            aria-label="Open Time Study Periods"
                          >
                            <AlertTriangle className="size-6 text-[#F97316] animate-pulse shrink-0" />
                            <span className="text-[11px] font-bold text-center leading-snug">
                              Clicked to view Time Study Period and Apportioning
                            </span>
                          </button>
                        ) : (
                          <PersonalTimeStudyPeriodsSection
                            className="animate-in fade-in slide-in-from-right-12 duration-500 ease-out"
                            timestudyAllowed={settingChecksQuery.data?.timestudyAllowedRaw ?? []}
                            dropdownData={dropdownQuery.data ?? []}
                          />
                        )}
                      </div>

                      {isTimeStudySupervisor && (
                        <ApportioningDrawer
                          open={periodsSheetOpen}
                          onClose={() => setPeriodsSheetOpen(false)}
                          timestudyAllowedRaw={settingChecksQuery.data?.timestudyAllowedRaw}
                          apportioningSummary={summaryQuery.data?.apportioningSummary}
                          dropdownData={dropdownQuery.data}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-4 mb-2">
                    <PersonalTimeStudyEntryForm
                      key={dateStr}
                      dateStr={dateStr}
                      initialRecords={dayQuery.data?.timeStudyRecords}
                      dropdownData={dropdownQuery.data}
                      leaveRecords={dayQuery.data?.leaveRecords as any}
                      onSave={(records) => submitMutation.mutate({ records, mode: "save" })}
                      onSubmit={(records) => submitMutation.mutate({ records, mode: "submit" })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      allocatedTotal={summaryQuery.data?.tsmins}
                      actualTotal={summaryQuery.data?.actualnormalactivitytime}
                      balanceTotal={summaryQuery.data?.actualnormalactivityTimebalance}
                      actualMultiTotal={summaryQuery.data?.actualmultiactivitytime}
                      multiBalanceTotal={summaryQuery.data?.actualmultiactivityTimebalance}
                      hideSummaryHeader={true}
                      apportioningConfig={settingChecksQuery.data ?? null}
                      apportioningRecords={dayQuery.data?.timeStudyRecords?.filter((r: any) => r.apportioning === true) || []}
                      apportioningSummary={summaryQuery.data?.apportioningSummary}
                      isLoading={dayQuery.isFetching || submitMutation.isPending || deleteMutation.isPending}
                      isDropdownLoading={dropdownQuery.isFetching}
                      onOpenDropdown={handleOpenDropdown}
                      departmentMulticodes={departmentMulticodes}
                      fetchingDepartments={fetchingDepartments}
                      onFetchMulticodeDept={fetchMulticodeProgramsForDepartment}
                      refetchConfig={settingChecksQuery.refetch}
                      hideApportioningInfo={isTimeStudySupervisor}
                      onOpenPeriodsSheet={() => setPeriodsSheetOpen(true)}
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

export default PersonalTimeStudyPage

