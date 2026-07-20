/**
 * MgtCalendarCard
 *
 * Reuses PersonalTimeStudyCalendarCard for the day grid rendering,
 * then overlays week-level TOTAL(MIN.) / STATUS / ACTION columns
 * in a side table aligned per week row.
 *
 * The day grid is rendered by PersonalTimeStudyCalendarCard (which uses
 * AppCalender internally). The week summary columns are rendered in a
 * separate table column that aligns row-by-row with the week rows.
 */
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { getCalendarWeekStartKeyFromIso } from "@/components/Calender"
import type { MgtDayStatusMap, MgtWeekSummary } from "../types"
import { toIsoYmdFromDate } from "@/lib/dates"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"



type MgtCalendarCardProps = {
  currentDate: Date
  onMonthChange: (date: Date) => void
  dayStatuses: MgtDayStatusMap
  weekSummaries: Record<string, MgtWeekSummary>
  /** Called when the supervisor approves a week row */
  onApproveWeek?: (weekIndex: number, dates: Date[]) => void
  /** Called when the supervisor rejects a week row */
  onRejectWeek?: (weekIndex: number, dates: Date[]) => void
}

export function MgtCalendarCard({
  currentDate,
  onMonthChange,
  dayStatuses,
  weekSummaries,
  onApproveWeek,
  onRejectWeek,
}: MgtCalendarCardProps) {
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const monthStart = new Date(year, month, 1)
  const monthEnd   = new Date(year, month + 1, 0)
  
  const days: Date[] = []
  const curDay = new Date(monthStart)
  while (curDay <= monthEnd) {
    days.push(new Date(curDay))
    curDay.setDate(curDay.getDate() + 1)
  }

  const startPad   = (monthStart.getDay() + 6) % 7 // Mon = 0
  const cells: (Date | null)[] = [...Array(startPad).fill(null), ...days]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const todayStr = toIsoYmdFromDate(new Date())

  return (
    <div className="rounded-[6px] bg-white p-4 shadow-[0_4px_16px_rgba(16,24,40,0.12)]">
      {/* Month navigation — same style as PersonalTimeStudyCalendarCard */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => {
              const d = new Date(currentDate)
              d.setFullYear(d.getFullYear() - 1)
              onMonthChange(d)
            }}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const d = new Date(currentDate)
              d.setMonth(d.getMonth() - 1)
              onMonthChange(d)
            }}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm font-semibold text-[#6C5DD3]">
          {currentDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              const d = new Date(currentDate)
              d.setMonth(d.getMonth() + 1)
              onMonthChange(d)
            }}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const d = new Date(currentDate)
              d.setFullYear(d.getFullYear() + 1)
              onMonthChange(d)
            }}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar table — extends PersonalTimeStudyCalendarCard day grid
          by adding TOTAL(MIN.), STATUS, ACTION columns per week row */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-gray-200">
              {["MON","TUE","WED","THU","FRI","SAT","SUN"].map((d) => (
                <th key={d} className="py-2 text-center font-semibold text-gray-600 w-10">{d}</th>
              ))}
              <th className="py-2 text-center font-semibold text-gray-600 min-w-[80px]">TOTAL(MIN.)</th>
              <th className="py-2 text-center font-semibold text-gray-600 min-w-[70px]">STATUS</th>
              <th className="py-2 text-center font-semibold text-gray-600 min-w-[80px]">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, wi) => {
              const datesInWeek = week.filter(Boolean) as Date[]
              const firstDate = datesInWeek[0]

              // Mon–Sun week key — must match getCalendarWeekStartKeyFromIso / AppCalender rows
              const weekKey = firstDate
                ? getCalendarWeekStartKeyFromIso(toIsoYmdFromDate(firstDate))
                : ""
              const summary = weekSummaries[weekKey]

              return (
                <tr key={wi} className="border-b border-gray-100">
                  {week.map((d, di) => {
                    const dateStr  = d ? toIsoYmdFromDate(d) : null
                    const isToday  = dateStr === todayStr
                    const isOtherMonth = d && d.getMonth() !== currentDate.getMonth()
                    const ds       = dateStr ? dayStatuses[dateStr] : undefined
                    const dotColor = ds?.color

                    const cell = d ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <span className={`relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                          isToday
                            ? "bg-[#6C5DD3]/20 text-[#6C5DD3] font-bold"
                            : isOtherMonth
                            ? "text-gray-300"
                            : "text-gray-700"
                        }`}>
                          {d.getDate()}
                          {ds?.hasNotes && (
                            <span className="absolute top-0 right-0 text-[8px] leading-none text-[#6C5DD3] font-black pointer-events-none" style={{ textShadow: '0 0 4px rgba(255,255,255,0.9), 0 1px 3px rgba(108,93,211,0.5)' }}>
                              ★
                            </span>
                          )}
                        </span>
                        {dotColor && (
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: dotColor }}
                          />
                        )}
                      </div>
                    ) : null

                    return (
                      <td key={di} className="py-2 text-center">
                        {d && ds?.noteText ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-block cursor-pointer">{cell}</div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[200px] text-xs">
                              <span className="block break-all break-words">
                                {ds.noteText}
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          cell
                        )}
                      </td>
                    )
                  })}

                  {/* TOTAL(MIN.) */}
                  <td className="py-2 text-center text-gray-700 font-medium text-xs">
                    {summary ? summary.totalMinutes : "—"}
                  </td>

                  {/* STATUS */}
                  <td className="py-2 text-center">
                    {summary ? (
                      <span className="inline-flex items-center justify-center gap-1 text-[#6C5DD3] text-xs font-medium capitalize">
                        {summary.status.replace(/_/g, " ")}
                      </span>
                    ) : datesInWeek.length > 0 ? (
                      <span className="inline-flex items-center justify-center gap-1 text-gray-400 text-xs">
                        No data
                      </span>
                    ) : null}
                  </td>

                  {/* ACTION */}
                  <td className="py-2 text-center">
                    {datesInWeek.length > 0 && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          title="Approve week"
                          onClick={() => onApproveWeek?.(wi, datesInWeek)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors text-xs font-bold"
                        >
                          ✓
                        </button>
                        <button
                          title="Reject week"
                          onClick={() => onRejectWeek?.(wi, datesInWeek)}
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
