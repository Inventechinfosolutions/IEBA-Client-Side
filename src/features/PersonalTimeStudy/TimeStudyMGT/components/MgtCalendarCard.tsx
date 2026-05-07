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
import type { MgtDayStatusMap, MgtWeekSummary } from "../types"



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
  const year = currentDate.getUTCFullYear()
  const month = currentDate.getUTCMonth()
  
  const monthStart = new Date(Date.UTC(year, month, 1))
  const monthEnd   = new Date(Date.UTC(year, month + 1, 0))
  
  const days: Date[] = []
  const curDay = new Date(monthStart)
  while (curDay <= monthEnd) {
    days.push(new Date(curDay))
    curDay.setUTCDate(curDay.getUTCDate() + 1)
  }

  const startPad   = (monthStart.getUTCDay() + 6) % 7 // Mon = 0
  const cells: (Date | null)[] = [...Array(startPad).fill(null), ...days]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const _now = new Date()
  const todayStr = new Date(Date.UTC(_now.getFullYear(), _now.getMonth(), _now.getDate())).toISOString().split("T")[0]

  return (
    <div className="rounded-[6px] bg-white p-4 shadow-[0_4px_16px_rgba(16,24,40,0.12)]">
      {/* Month navigation — same style as PersonalTimeStudyCalendarCard */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => {
              const d = new Date(currentDate)
              d.setUTCFullYear(d.getUTCFullYear() - 1)
              onMonthChange(d)
            }}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const d = new Date(currentDate)
              d.setUTCMonth(d.getUTCMonth() - 1)
              onMonthChange(d)
            }}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm font-semibold text-[#6C5DD3]">
          {currentDate.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => {
              const d = new Date(currentDate)
              d.setUTCMonth(d.getUTCMonth() + 1)
              onMonthChange(d)
            }}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const d = new Date(currentDate)
              d.setUTCFullYear(d.getUTCFullYear() + 1)
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
              
              // Get the Sunday key for this week row
              const firstDate = datesInWeek[0]
              let weekKey = ""
              if (firstDate) {
                const d = new Date(firstDate)
                const day = d.getUTCDay()
                const diff = d.getUTCDate() - day
                const sunday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff))
                weekKey = sunday.toISOString().split('T')[0]
              }
              const summary = weekSummaries[weekKey]

              return (
                <tr key={wi} className="border-b border-gray-100">
                  {week.map((d, di) => {
                    const dateStr  = d ? d.toISOString().split("T")[0] : null
                    const isToday  = dateStr === todayStr
                    const isOtherMonth = d && d.getUTCMonth() !== currentDate.getUTCMonth()
                    const ds       = dateStr ? dayStatuses[dateStr] : undefined
                    const dotColor = ds?.color

                    return (
                      <td key={di} className="py-2 text-center">
                        {d ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                              isToday
                                ? "bg-[#6C5DD3]/20 text-[#6C5DD3] font-bold"
                                : isOtherMonth
                                ? "text-gray-300"
                                : "text-gray-700"
                            }`}>
                              {d.getUTCDate()}
                            </span>
                            {dotColor && (
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ backgroundColor: dotColor }}
                              />
                            )}
                          </div>
                        ) : null}
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
