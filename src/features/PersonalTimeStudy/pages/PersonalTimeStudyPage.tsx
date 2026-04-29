import { format } from "date-fns"
import { getUserDetails } from "@/features/auth/api/getUserDetails"
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Check, X, AlertCircle, Lock } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { useAuth } from "@/contexts/AuthContext"
import { usePermissions } from "@/hooks/usePermissions"
import {
  apiGetDayDetail,
  apiGetMonthLegend,
  apiSaveNotes,
  apiSubmitTimeRecords,
  apiGetUserProgramsAndActivities,
  apiDeleteTimeRecord
} from "../api/personalTimeStudyApi"
import { PersonalTimeStudyCalendarCard } from "../components/PersonalTimeStudyCalendarCard"
import { PersonalTimeStudyEntryForm } from "../components/PersonalTimeStudyEntryForm"
import { PersonalTimeStudyLeaveCard } from "../components/PersonalTimeStudyLeaveCard"
import { PersonalTimeStudyLegendCard } from "../components/PersonalTimeStudyLegendCard"
import { PersonalTimeStudyMinutesCard } from "../components/PersonalTimeStudyMinutesCard"
import { PersonalTimeStudyNotesSection } from "../components/PersonalTimeStudyNotesSection"
import { personalTimeStudyKeys } from "../keys"
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

export function PersonalTimeStudyPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ""

  
  const { canReview } = usePermissions()
  const canReviewMgt = canReview("timestudysupervisor")

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("personal")

  // 1. Date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const dateStr = format(selectedDate, "yyyy-MM-dd")
  const month = selectedDate.getMonth() + 1
  const year = selectedDate.getFullYear()

  // 2. Fetch Month Legend — only when Personal tab is active
  const monthQuery = useQuery({
    queryKey: personalTimeStudyKeys.monthLegend(userId, month, year),
    queryFn: () => apiGetMonthLegend({ userId, month, year }),
    enabled: !!userId && activeTab === "personal",
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  // 3. Fetch Day Detail — only when Personal tab is active
  const dayQuery = useQuery({
    queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr),
    queryFn: () => apiGetDayDetail({ userId, date: dateStr, month, year }),
    enabled: !!userId && activeTab === "personal",
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  // 4. Fetch user & dropdown data
  useQuery({
    queryKey: ["user-details", userId],
    queryFn: () => getUserDetails(userId),
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  const dropdownQuery = useQuery({
    queryKey: personalTimeStudyKeys.dropdowns(userId),
    queryFn: () => apiGetUserProgramsAndActivities(userId),
    enabled: !!userId && activeTab === "personal",
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })

  // 5. Calendar day & week summaries
  const { dayStatuses, weekSummaries } = useMemo(() => {
    const dayMap: Record<string, { status: string; color?: string }> = {}
    const weekMap: Record<string, { totalMinutes: number, days: string[] }> = {}

    if (!monthQuery.data?.data) return { dayStatuses: {}, weekSummaries: {} }

    for (const d of monthQuery.data.data) {
      const s = String(d.status).toLowerCase()
      // If unlocked (opened), don't show the cell color
      const cellColor = s === "opened" ? undefined : (d.color ?? undefined)
      dayMap[d.date] = { status: d.status, color: cellColor }
      
      const weekKey = getWeekStartKey(d.date)
      if (!weekMap[weekKey]) {
        weekMap[weekKey] = { totalMinutes: 0, days: [] }
      }
      weekMap[weekKey].totalMinutes += d.minutes ?? 0
      weekMap[weekKey].days.push(d.status)
    }

    const weekSummaries: Record<string, any> = {}
    for (const [key, val] of Object.entries(weekMap)) {
      let finalStatus = "notsubmitted"
      const lowerDays = val.days.map(d => String(d).toLowerCase())
      
      const allApproved = lowerDays.length > 0 && lowerDays.every(d => d === "approved")
      const allRejected = lowerDays.length > 0 && lowerDays.every(d => d === "rejected")
      const hasAnyWork = lowerDays.length > 0 || val.totalMinutes > 0

      if (allApproved) finalStatus = "approved"
      else if (allRejected) finalStatus = "rejected"
      else if (hasAnyWork) finalStatus = "submitted"
      
      weekSummaries[key] = { totalMinutes: val.totalMinutes, status: finalStatus }
    }

    return { dayStatuses: dayMap, weekSummaries }
  }, [monthQuery.data])

  const renderStatus = (_weekIndex: number, _dates: Date[], status: any) => {
    const s = String(status).toLowerCase()
    if (s === "approved") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#6C757D] shrink-0 cursor-help">
              <Lock className="size-2.5 text-white" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Approved</TooltipContent>
        </Tooltip>
      )
    }
    if (s === "rejected") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#DC3545] shrink-0 cursor-help">
              <X className="size-2.5 text-white" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Rejected</TooltipContent>
        </Tooltip>
      )
    }
    if (s === "submitted" || s === "submittedexceed" || s === "submittedless") {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#F97316] shrink-0 cursor-help">
              <X className="size-2.5 text-white" aria-hidden />
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Time sheet pending</TooltipContent>
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
  const notesMutation = useMutation({
    mutationFn: (notes: string) => apiSaveNotes({ date: dateStr, notes }),
    onSuccess: () => {
      toast.success("Notes saved")
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr) })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save notes")
    },
  })

  const submitMutation = useMutation({
    mutationFn: ({ records, mode }: { records: any[]; mode: "save" | "submit" }) =>
      apiSubmitTimeRecords(records, mode),
    onSuccess: (_, { mode }) => {
      toast.success(`Records ${mode === "save" ? "saved" : "submitted"} successfully`)
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr) })
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.monthLegend(userId, month, year) })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to process records")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDeleteTimeRecord(id),
    onSuccess: () => {
      toast.success("Entry deleted")
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.dayDetail(userId, dateStr) })
      queryClient.invalidateQueries({ queryKey: personalTimeStudyKeys.monthLegend(userId, month, year) })
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete entry")
    },
  })

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
                    currentMonthDate={selectedDate}
                    onMonthChange={setSelectedDate}
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
                      leaveCount={dayQuery.data?.leaveRecords?.length ?? 0}
                      approved={dayQuery.data?.leaveRecords?.filter(r => r.status.toLowerCase() === "approved").length ?? 0}
                      open={dayQuery.data?.leaveRecords?.filter(r => r.status.toLowerCase() === "open").length ?? 0}
                      rejected={dayQuery.data?.leaveRecords?.filter(r => r.status.toLowerCase() === "rejected").length ?? 0}
                      dropdownData={dropdownQuery.data}
                      onOpen={() => dropdownQuery.refetch()}
                    />
                    <PersonalTimeStudyMinutesCard
                      className="min-h-0 sm:col-span-2 lg:col-span-1"
                      allocatedMinutes={dayQuery.data?.allocatedMinutes ?? 0}
                      actualMinutes={dayQuery.data?.consumedMinutes ?? 0}
                      balanceMinutes={dayQuery.data?.balanceMinutes ?? 0}
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

              <div className="mt-4 mb-4">
                <PersonalTimeStudyEntryForm
                  key={dateStr}
                  dateStr={dateStr}
                  initialRecords={dayQuery.data?.timeStudyRecords}
                  dropdownData={dropdownQuery.data}
                  onSave={(records) => submitMutation.mutate({ records, mode: "save" })}
                  onSubmit={(records) => submitMutation.mutate({ records, mode: "submit" })}
                  onDelete={(id) => deleteMutation.mutate(id)}
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
