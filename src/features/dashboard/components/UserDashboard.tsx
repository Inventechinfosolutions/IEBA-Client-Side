import React, { useState, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useSelfLeave, useTodos, useReportsByRole, useHolidays, useDashboardOverview } from "../queries/dashboardQueries"
import { PersonalTimeStudyCard } from "../components/PersonalTimeStudyCard"
import { PersonalLeaveCard } from "../components/PersonalLeaveCard"
import { ReportsCard } from "../components/ReportsCard"
import { TodoCard } from "../components/TodoCard"
import { Card } from "@/components/ui/card"
import { Lock, Check, X, MessageCircle, Plus, Minus } from "lucide-react"
import { PersonalTimeStudyCalendarCard } from "../../PersonalTimeStudy/components/PersonalTimeStudyCalendarCard"
import { useGetPersonalMonthLegend } from "../../PersonalTimeStudy/queries/getPersonalMonthLegend"
import { useGetPersonalDayDetail } from "../../PersonalTimeStudy/queries/getPersonalDayDetail"
import { useGetTimeEntrySummary } from "../../PersonalTimeStudy/queries/getTimeEntrySummary"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { toIsoYmdFromDate, todayLocal } from "@/lib/dates"

function getWeekStartKey(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const day = date.getDay()
  const diff = date.getDate() - day
  const sunday = new Date(date.getFullYear(), date.getMonth(), diff)
  return toIsoYmdFromDate(sunday)
}

function getWeeklyStatus(days: string[], totalMinutes: number, targetMinutes: number): string {
  if (days.length === 0) return "notsubmitted"
  const lowerDays = days.map(d => String(d || "").toLowerCase())
  const allApproved = lowerDays.every(d => d === "approved")
  if (allApproved) return "approved"
  const hasRejected = lowerDays.some(d => d === "rejected")
  if (hasRejected) return "rejected"
  const hasNotSubmitted = lowerDays.some(d => !d || d === "opened" || d === "notsubmitted" || d === "undefined")
  if (hasNotSubmitted) return "pending"
  if (totalMinutes === targetMinutes) return "equal"
  if (totalMinutes < targetMinutes) return "less"
  return "more"
}

export function UserDashboard() {
  const { user } = useAuth()
  const userId = user?.id ?? ""

  const deptRoles = user?.departmentRoles ?? []
  const currentDeptRole = deptRoles[0]
  const departmentId = currentDeptRole?.departmentId
  const roleId = currentDeptRole?.roleId

  const overview = useDashboardOverview({ 
    userId,
    departmentId, 
    roleId, 
    enabled: true 
  })
  const selfLeave = useSelfLeave(userId)
  const todos = useTodos(userId)
  const reports = useReportsByRole({ departmentId, roleId })
  const holidays = useHolidays()

  const tsApproved = overview.data?.timeStudyRecordByUserStatusCounts?.find((s: any) => s.status === 'approved')?.count ?? 0
  const tsSubmitted = overview.data?.timeStudyRecordByUserStatusCounts?.find((s: any) => s.status === 'submitted')?.count ?? 0

  const selfLeaveTotal = selfLeave.data?.total ?? 0
  const selfLeaveApproved = selfLeave.data?.approved ?? 0
  const selfLeaveOpen = selfLeave.data?.requested ?? 0
  const selfLeaveRejected = selfLeave.data?.rejected ?? 0

  const nextHolidayMonth = holidays.data?.nextMonth ?? ""
  const nextHolidayDay = holidays.data?.nextDay ?? "0"

  const todoItems = todos.data ?? []
  const reportsData = reports.data ?? []


  // Calendar State & Logic
  const [selectedDate, setSelectedDate] = useState<Date>(todayLocal)
  const [viewportDate, setViewportDate] = useState<Date>(selectedDate)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({})

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const dateStr = toIsoYmdFromDate(selectedDate)
  const month = viewportDate.getMonth() + 1
  const year = viewportDate.getFullYear()

  const handleMonthChange = (newViewport: Date) => {
    setViewportDate(newViewport)
    if (
      selectedDate.getMonth() !== newViewport.getMonth() ||
      selectedDate.getFullYear() !== newViewport.getFullYear()
    ) {
      const firstOfMonth = new Date(newViewport.getFullYear(), newViewport.getMonth(), 1)
      setSelectedDate(firstOfMonth)
    }
  }

  const monthQuery = useGetPersonalMonthLegend(userId, month, year, true)
  const dayQuery = useGetPersonalDayDetail(userId, dateStr, month, year, true)
  const summaryQuery = useGetTimeEntrySummary(userId, dateStr, undefined, true)

  const { dayStatuses, weekSummaries } = useMemo(() => {
    const dayMap: Record<string, { status: string; color?: string; hasNotes?: boolean; noteText?: string }> = {}
    const weekMap: Record<string, { totalMinutes: number, targetMinutes: number, days: string[] }> = {}

    if (!monthQuery.data?.data) return { dayStatuses: {}, weekSummaries: {} }

    for (const d of monthQuery.data.data) {
      const s = String(d.status).toLowerCase()
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

    const dbAssignedMinutes = monthQuery.data.data.find(d => (d.allocatedMinutes ?? 0) > 0)?.allocatedMinutes ?? 0
    const weekSummaries: Record<string, any> = {}
    for (const [key, val] of Object.entries(weekMap)) {
      const weeklyTarget = 7 * dbAssignedMinutes
      const finalStatus = getWeeklyStatus(val.days, val.totalMinutes, weeklyTarget)
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
            <Lock className="size-4 text-gray-500 shrink-0 cursor-help" aria-hidden />
          </TooltipTrigger>
          <TooltipContent className="text-xs">Approved</TooltipContent>
        </Tooltip>
      )
    }
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

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 w-full">
        {/* Top Section: Calendar + Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">

          {/* Left: Calendar Widget (4/12 width) */}
          <div className="lg:col-span-4 xl:col-span-4 flex">
            <PersonalTimeStudyCalendarCard
              weekRows={[]}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              currentMonthDate={viewportDate}
              onMonthChange={handleMonthChange}
              dayStatuses={dayStatuses}
              weekSummaries={weekSummaries}
              renderStatus={renderStatus}
              className="w-full"
            />
          </div>


          <div className="lg:col-span-5 flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="h-[210px]">
                <PersonalTimeStudyCard
                  totalApproved={tsApproved}
                  totalSubmitted={tsSubmitted}
                  percent="0 %"
                  periodLabel="Bi Weekly"
                  isLoading={overview.isLoading}
                  noBlur={true}
                />
              </div>
              <div className="h-[210px]">
                <PersonalLeaveCard
                  total={selfLeaveTotal}
                  approved={selfLeaveApproved}
                  open={selfLeaveOpen}
                  rejected={selfLeaveRejected}
                  nextHolidayMonth={nextHolidayMonth}
                  nextHolidayDay={nextHolidayDay}
                  isLoading={selfLeave.isLoading}
                />
              </div>
            </div>



            <div className="grid grid-cols-12 gap-4 h-[180px] min-h-0">
              <div className="col-span-12 h-full min-h-0 overflow-hidden">
                <ReportsCard reports={reportsData} isLoading={reports.isLoading} />
              </div>
            </div>
          </div>



          <div className="lg:col-span-3">
            <div className="h-[406px]">
              <TodoCard items={todoItems} isLoading={todos.isLoading} />
            </div>
          </div>
        </div>

        <Card className="p-0 overflow-hidden rounded-[15px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] border-[#E8EAF6] bg-white">
          <div className="p-3 bg-white flex justify-end gap-8">
            <div className="text-[13px] flex items-center gap-2">
              <span className="text-[#6B7280] font-medium">Allocated TS Minutes:</span>
              <span className="font-bold text-[#111827]">{summaryQuery.data?.tsmins ?? 0}</span>
            </div>
            <div className="text-[13px] flex items-center gap-2">
              <span className="text-[#6B7280] font-medium">Actual Minutes:</span>
              <span className="font-bold text-[#6C5DD3]">{summaryQuery.data?.actualnormalactivitytime ?? 0}</span>
            </div>
            <div className="text-[13px] flex items-center gap-2">
              <span className="text-[#6B7280] font-medium">Balance:</span>
              <span className="font-bold text-[#6C5DD3]">{summaryQuery.data?.actualnormalactivityTimebalance ?? 0}</span>
            </div>
          </div>

          <div className="overflow-x-auto min-h-[250px] px-4 pb-4">
            <div className="rounded-[5px] overflow-hidden border border-[#E8EAF6] bg-white">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#6C5DD3] text-white text-[12px] font-bold uppercase">
                    <th className="w-10 px-3 py-3 border-r border-white/20 first:rounded-tl-[15px]"></th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Program</th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Activity</th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Start</th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">End</th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Travel</th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Total</th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Notes</th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center">Desc</th>
                    <th className="px-5 py-3 border-r border-white/20 last:border-0 text-center last:rounded-tr-[15px]">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {(() => {
                    const tsRecords = dayQuery.data?.timeStudyRecords || []
                    const leaveRecords = dayQuery.data?.leaveRecords || []

                    // Combine and sort by start time
                    const allRecords = [...tsRecords, ...leaveRecords].sort((a, b) => {
                      const timeA = a.starttime || (a as any).starttime || "00:00:00"
                      const timeB = b.starttime || (b as any).starttime || "00:00:00"
                      return timeA.localeCompare(timeB)
                    })

                    if (allRecords.length === 0) return null

                    return allRecords.map((record: any, idx) => {
                      const rowKey = `${record.date || dateStr}_${record.id || idx}`
                      const isExpanded = expandedRows[rowKey]
                      const children = record.multiCodeRecords || record.subRows || []
                      const hasChildren = children.length > 0

                      // For multi-code records, if parent is approved, children should usually be too
                      const parentStatus = record.status?.toLowerCase()

                      return (
                        <React.Fragment key={record.id || idx}>
                          <tr className="hover:bg-gray-50/50 transition-colors text-[12px]">
                            <td className="px-3 py-3 border-b border-r border-[#E8EAF6] text-center">
                              <button
                                onClick={() => toggleRow(rowKey)}
                                className={cn(
                                  "inline-flex items-center justify-center size-5 rounded-[6px] border border-gray-300 text-gray-500 transition-all duration-300",
                                  hasChildren ? "hover:border-[#6C5DD3] hover:text-[#6C5DD3] hover:bg-[#6C5DD3]/5" : "opacity-30 cursor-not-allowed"
                                )}
                                disabled={!hasChildren}
                              >
                                <span className={cn("transition-transform duration-500 flex items-center justify-center", isExpanded ? "rotate-[360deg]" : "rotate-0")}>
                                  {isExpanded ? <Minus className="size-3" /> : <Plus className="size-3" />}
                                </span>
                              </button>
                            </td>
                            <td className="px-5 py-3 border-b border-r border-[#E8EAF6] text-center">{record.programname}</td>
                            <td className="px-5 py-3 border-b border-r border-[#E8EAF6] text-center">{record.activityname}</td>
                            <td className="px-5 py-3 border-b border-r border-[#E8EAF6] text-center">{record.starttime}</td>
                            <td className="px-5 py-3 border-b border-r border-[#E8EAF6] text-center">{record.endtime}</td>
                            <td className="px-5 py-3 border-b border-r border-[#E8EAF6] text-center">{record.traveltime}</td>
                            <td className="px-5 py-3 border-b border-r border-[#E8EAF6] text-center font-semibold text-[#6C5DD3]">{record.activitytime}</td>
                            <td className="px-5 py-3 border-b border-r border-[#E8EAF6] text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center cursor-help">
                                    <span className="relative inline-flex size-5 items-center justify-center">
                                      <MessageCircle className="size-5 text-[#6C5DD3]" aria-hidden />
                                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[2.5px]">
                                        <span className="size-[2.5px] rounded-full bg-[#6C5DD3]" />
                                        <span className="size-[2.5px] rounded-full bg-[#6C5DD3]" />
                                        <span className="size-[2.5px] rounded-full bg-[#6C5DD3]" />
                                      </span>
                                    </span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="px-3 py-2 text-[11px] max-w-[250px] break-words">
                                  {dayQuery.data?.notes?.trim() || "No daily notes"}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="px-5 py-3 border-b border-r border-[#E8EAF6] text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center justify-center cursor-help">
                                    <span className="relative inline-flex size-5 items-center justify-center">
                                      <MessageCircle className="size-5 text-[#6C5DD3]" aria-hidden />
                                      <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[2.5px]">
                                        <span className="size-[2.5px] rounded-full bg-[#6C5DD3]" />
                                        <span className="size-[2.5px] rounded-full bg-[#6C5DD3]" />
                                        <span className="size-[2.5px] rounded-full bg-[#6C5DD3]" />
                                      </span>
                                    </span>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="px-3 py-2 text-[11px] max-w-[250px] break-words">
                                  {record.description?.trim() || "No description"}
                                </TooltipContent>
                              </Tooltip>
                            </td>
                            <td className="px-5 py-3 border-b border-[#E8EAF6] text-center">
                              <span className={cn(
                                "px-4 py-1 rounded-[6px] text-[12px] border bg-white text-[#111827] capitalize inline-block min-w-[90px]",
                                record.status?.toLowerCase() === "approved" ? "border-[#22c55e]" :
                                  record.status?.toLowerCase() === "rejected" ? "border-[#ef4444]" :
                                    "border-[#f59e0b]"
                              )}>
                                {record.status}
                              </span>
                            </td>
                          </tr>

                          {isExpanded && hasChildren && (
                            <tr className="bg-[#F9FAFB]">
                              <td colSpan={10} className="p-4 border-b">
                                <div className="rounded-[5px] overflow-hidden border border-[#E8EAF6] bg-white ml-8">
                                  <table className="w-full text-left border-separate border-spacing-0">
                                    <thead>
                                      <tr className="bg-[#6C5DD3]/90 text-white text-[11px] font-bold uppercase">
                                        <th className="px-4 py-2 border-r border-white/20 text-center">Program</th>
                                        <th className="px-4 py-2 border-r border-white/20 text-center">Activity</th>
                                        <th className="px-4 py-2 border-r border-white/20 text-center">Total</th>
                                        <th className="px-4 py-2 border-r border-white/20 text-center">Desc</th>
                                        <th className="px-4 py-2 last:border-0 text-center">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {children.map((sub: any, sIdx: number) => (
                                        <tr key={sub.id || sIdx} className="hover:bg-gray-50/50 transition-colors text-[11px]">
                                          <td className="px-4 py-2 border-b border-r border-[#E8EAF6] text-center">{sub.programname || sub.programName || '-'}</td>
                                          <td className="px-4 py-2 border-b border-r border-[#E8EAF6] text-center">{sub.activityname || sub.activityName || '-'}</td>
                                          <td className="px-4 py-2 border-b border-r border-[#E8EAF6] text-center font-semibold text-[#6C5DD3]">{sub.activitytime || sub.activityTime || sub.totalmin || sub.totalMin || '-'}</td>
                                          <td className="px-4 py-2 border-b border-r border-[#E8EAF6] text-center">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <span className="inline-flex items-center justify-center cursor-help">
                                                  <span className="relative inline-flex size-5 items-center justify-center">
                                                    <MessageCircle className="size-5 text-[#6C5DD3]" aria-hidden />
                                                    <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[2px]">
                                                      <span className="size-[2px] rounded-full bg-[#6C5DD3]" />
                                                      <span className="size-[2px] rounded-full bg-[#6C5DD3]" />
                                                      <span className="size-[2px] rounded-full bg-[#6C5DD3]" />
                                                    </span>
                                                  </span>
                                                </span>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="px-3 py-2 text-[11px] max-w-[200px] break-words">
                                                {sub.description?.trim() || sub.notes?.trim() || "No description"}
                                              </TooltipContent>
                                            </Tooltip>
                                          </td>
                                          <td className="px-4 py-2 border-b text-center">
                                            {(() => {
                                              const effectiveStatus = parentStatus === "approved" ? "approved" : (sub.status || record.status)
                                              return (
                                                <span className={cn(
                                                  "px-3 py-0.5 rounded-[4px] text-[10px] border bg-white text-[#111827] capitalize inline-block",
                                                  effectiveStatus?.toLowerCase() === "approved" ? "border-[#22c55e]" :
                                                    effectiveStatus?.toLowerCase() === "rejected" ? "border-[#ef4444]" :
                                                      "border-[#f59e0b]"
                                                )}>
                                                  {effectiveStatus}
                                                </span>
                                              )
                                            })()}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })
                  })() || (
                      <tr className="group">
                        <td colSpan={10} className="text-center py-16 bg-white">
                          <div className="flex flex-col items-center gap-4 opacity-100 transition-all duration-300">
                            <div className="w-32 h-32 flex items-center justify-center">
                              <img src={tableEmptyIcon} alt="No data" className="w-28 h-28" />
                            </div>
                            <span className="text-[#9CA3AF] text-[15px] font-medium mt-[-4px]"></span>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  )
}
