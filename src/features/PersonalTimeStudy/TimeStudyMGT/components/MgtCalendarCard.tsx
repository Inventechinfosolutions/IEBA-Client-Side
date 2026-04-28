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
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  subMonths,
} from "date-fns"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import type { MgtDayStatusMap } from "../types"

const STATUS_COLOR_MAP: Record<string, string> = {
  approved:   "#6B7280",
  lesshours:  "#F97316",
  morehours:  "#EF4444",
  equalhours: "#22C55E",
  submitted:  "#3B82F6",
}

type MgtCalendarCardProps = {
  currentDate: Date
  onMonthChange: (date: Date) => void
  dayStatuses: MgtDayStatusMap
  /** Called when the supervisor approves a week row */
  onApproveWeek?: (weekIndex: number, dates: Date[]) => void
  /** Called when the supervisor rejects a week row */
  onRejectWeek?: (weekIndex: number, dates: Date[]) => void
}

export function MgtCalendarCard({
  currentDate,
  onMonthChange,
  dayStatuses,
  onApproveWeek,
  onRejectWeek,
}: MgtCalendarCardProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad   = (getDay(monthStart) + 6) % 7 // Mon = 0

  const cells: (Date | null)[] = [...Array(startPad).fill(null), ...days]
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const todayStr = format(new Date(), "yyyy-MM-dd")

  return (
    <div className="rounded-[6px] bg-white p-4 shadow-[0_4px_16px_rgba(16,24,40,0.12)]">
      {/* Month navigation — same style as PersonalTimeStudyCalendarCard */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange(subMonths(currentDate, 12))}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(subMonths(currentDate, 1))}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <span className="text-sm font-semibold text-[#6C5DD3]">
          {format(currentDate, "MMMM yyyy")}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onMonthChange(addMonths(currentDate, 1))}
            className="rounded p-1 text-[#6C5DD3] hover:bg-purple-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => onMonthChange(addMonths(currentDate, 12))}
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

              return (
                <tr key={wi} className="border-b border-gray-100">
                  {week.map((d, di) => {
                    const dateStr  = d ? format(d, "yyyy-MM-dd") : null
                    const isToday  = dateStr === todayStr
                    const isOtherMonth = d && d.getMonth() !== currentDate.getMonth()
                    const ds       = dateStr ? dayStatuses[dateStr] : undefined
                    const dotColor = ds?.color ?? (ds?.status ? STATUS_COLOR_MAP[ds.status.toLowerCase()] : undefined)

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
                              {d.getDate()}
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
                  <td className="py-2 text-center text-gray-400 text-xs">—</td>

                  {/* STATUS */}
                  <td className="py-2 text-center">
                    {datesInWeek.length > 0 ? (
                      <span className="inline-flex items-center justify-center gap-1 text-gray-400 text-xs">
                        <svg className="h-4 w-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
                        </svg>
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
