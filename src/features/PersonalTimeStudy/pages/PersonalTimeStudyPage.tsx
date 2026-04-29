import { format } from "date-fns"
import { getUserDetails } from "@/features/auth/api/getUserDetails"
import { useMemo, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { useAuth } from "@/contexts/AuthContext"
import {
  apiGetDayDetail,
  apiGetMonthLegend,
  apiSaveNotes,
  apiSubmitTimeRecords,
  apiGetUserProgramsAndActivities
} from "../api/personalTimeStudyApi"
import { PersonalTimeStudyCalendarCard } from "../components/PersonalTimeStudyCalendarCard"
import { PersonalTimeStudyEntryForm } from "../components/PersonalTimeStudyEntryForm"
import { PersonalTimeStudyLeaveCard } from "../components/PersonalTimeStudyLeaveCard"
import { PersonalTimeStudyLegendCard } from "../components/PersonalTimeStudyLegendCard"
import { PersonalTimeStudyMinutesCard } from "../components/PersonalTimeStudyMinutesCard"
import { PersonalTimeStudyNotesSection } from "../components/PersonalTimeStudyNotesSection"
import type { WeekSummaryRow } from "../components/PersonalTimeStudyWeekSummary"
import { TimeStudyMGTPage } from "../TimeStudyMGT"

type ActiveTab = "personal" | "mgt"

export function PersonalTimeStudyPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const userId = user?.id ?? ""

  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>("personal")

  // 1. Date state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const dateStr = format(selectedDate, "yyyy-MM-dd")
  const month = selectedDate.getMonth() + 1
  const year = selectedDate.getFullYear()

  // 2. Fetch Month Legend — only when Personal tab is active
  const monthQuery = useQuery({
    queryKey: ["personal-time-study", "month", userId, month, year],
    queryFn: () => apiGetMonthLegend({ userId, month, year }),
    enabled: !!userId && activeTab === "personal",
  })

  // 3. Fetch Day Detail — only when Personal tab is active
  const dayQuery = useQuery({
    queryKey: ["personal-time-study", "day", userId, dateStr],
    queryFn: () => apiGetDayDetail({ userId, date: dateStr, month, year }),
    enabled: !!userId && activeTab === "personal",
  })

  // 4. Fetch user & dropdown data
  useQuery({
    queryKey: ["user-details", userId],
    queryFn: () => getUserDetails(userId),
    enabled: !!userId,
  })

  const dropdownQuery = useQuery({
    queryKey: ["personal-time-study", "dropdowns", userId],
    queryFn: () => apiGetUserProgramsAndActivities(userId),
    enabled: !!userId && activeTab === "personal",
  })

  // 5. Calendar day statuses
  const dayStatuses = useMemo(() => {
    if (!monthQuery.data?.data) return {}
    return monthQuery.data.data.reduce((acc, d) => {
      acc[d.date] = { status: d.status, color: d.color ?? undefined }
      return acc
    }, {} as Record<string, { status: string; color?: string }>)
  }, [monthQuery.data])

  // 6. Notes local state
  const [localNotes, setLocalNotes] = useState("")
  useMemo(() => {
    if (dayQuery.data?.notes !== undefined) {
      setLocalNotes(dayQuery.data.notes ?? "")
    }
  }, [dayQuery.data?.notes])

  // 7. Mutations
  const notesMutation = useMutation({
    mutationFn: (notes: string) => apiSaveNotes({ date: dateStr, notes }),
    onSuccess: () => {
      toast.success("Notes saved")
      queryClient.invalidateQueries({ queryKey: ["personal-time-study", "day", userId, dateStr] })
    },
    onError: () => toast.error("Failed to save notes"),
  })

  const submitMutation = useMutation({
    mutationFn: ({ records, mode }: { records: any[]; mode: "save" | "submit" }) =>
      apiSubmitTimeRecords(records, mode),
    onSuccess: (_, { mode }) => {
      toast.success(`Records ${mode === "save" ? "saved" : "submitted"} successfully`)
      queryClient.invalidateQueries({ queryKey: ["personal-time-study", "day", userId, dateStr] })
      queryClient.invalidateQueries({ queryKey: ["personal-time-study", "month", userId, month, year] })
    },
    onError: () => toast.error("Failed to process records"),
  })

  const weekRows: WeekSummaryRow[] = useMemo(() => [], [])

  return (
    <section className="font-roboto *:font-roboto box-border w-full min-w-0 max-w-full overflow-x-hidden">
      <div className="box-border w-full min-w-0 max-w-full px-6 py-4">

      {/* ── Outer card wrapping BOTH tabs — same as Payroll page ── */}
      <div className="box-border mx-auto min-w-0 w-full max-w-full overflow-hidden rounded-[6px] border border-[#e7e9f2] bg-white shadow-[0_0_14px_0_rgb(0_0_0/0.04),0_0_1px_0_rgb(0_0_0/0.06)]">

        {/* Tab Bar — Program-style design */}
        <div className="border-b border-[#eef0f5]">
          <div className="grid grid-cols-2 select-none gap-0 bg-white">
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
                />
              </div>
            </>
          )}

          {/* ── Time Study MGT Tab ── */}
          {activeTab === "mgt" && <TimeStudyMGTPage />}

        </div>
      </div>
      </div>
    </section>
  )
}
