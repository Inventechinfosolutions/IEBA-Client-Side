import AppCalender from "@/components/Calender"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { WeekSummaryRow } from "./PersonalTimeStudyWeekSummary"

type PersonalTimeStudyCalendarCardProps = {
  weekRows: WeekSummaryRow[]
  selectedDate?: Date | null
  onDateSelect?: (date: Date) => void
  onDayActivate?: (date: Date) => void
  onDayTabOut?: () => void
  currentMonthDate?: Date
  onMonthChange?: (date: Date) => void
  dayStatuses?: Record<string, any>
  weekSummaries?: Record<string, any>
  showActionColumn?: boolean
  renderStatus?: (weekIndex: number, dates: Date[], status: any) => React.ReactNode
  renderAction?: (weekIndex: number, dates: Date[], status: any) => React.ReactNode
  /** Personal tab uses a compact 9-column grid; MGT uses a wider 10-column grid with ACTION. */
  variant?: "personal" | "management"
  className?: string
}

const CALENDAR_BASE_CLASS =
  "w-full gap-0 [&_.ieba-time-study-calendar]:gap-1 [&_.ieba-time-study-calendar]:bg-transparent [&_.calendar-card]:rounded-none [&_.calendar-card]:p-0 [&_.calendar-card]:shadow-none [&_.calendar-header]:mb-2 [&_.calendar-header_.text-2xl]:text-[14px] sm:[&_.calendar-header_.text-2xl]:text-[16px] [&_.calendar-header_.text-2xl]:font-semibold [&_.calendar-header_.text-2xl]:text-[#6C5DD3] [&_.days-of-week-container>div]:text-[9px] sm:[&_.days-of-week-container>div]:text-[10px] [&_.days-of-week-container>div]:font-semibold [&_.days-of-week-container>div]:text-[#111827] dark:[&_.days-of-week-container>div]:text-white [&_.week-summary-header]:text-[7.5px] sm:[&_.week-summary-header]:text-[9px] [&_.week-summary-header]:font-semibold [&_.week-summary-header]:text-[#111827] dark:[&_.week-summary-header]:text-white [&_.day-cell.selected]:bg-[#F3F0FF] [&_.day-cell.selected]:text-[#6C5DD3] [&_.day-cell.selected]:shadow-none [&_.day-cell.selected]:ring-2 [&_.day-cell.selected]:ring-[#6C5DD3] [&_.day-cell.selected]:ring-offset-1"

const CALENDAR_PERSONAL_CLASS =
  "[&_.calendar-weeks-grid]:w-full [&_.calendar-weeks-grid]:![grid-template-columns:repeat(7,minmax(0,1fr))_minmax(0,1fr)_minmax(0,0.9fr)] [&_.calendar-weeks-grid]:column-gap-1 sm:[&_.calendar-weeks-grid]:column-gap-2 [&_.calendar-weeks-grid]:row-gap-1.5 sm:[&_.calendar-weeks-grid]:row-gap-2 [&_.week-summary-header]:px-0 sm:[&_.week-summary-header]:px-0.5 [&_.week-summary-total]:px-0 sm:[&_.week-summary-total]:px-0.5 [&_.week-summary-status]:px-0 sm:[&_.week-summary-status]:px-0.5 [&_.day-cell]:aspect-square [&_.day-cell]:h-auto [&_.day-cell]:w-full [&_.day-cell]:max-w-8 [&_.day-cell]:text-[10px] sm:[&_.day-cell]:text-[11px] [&_.week-summary-total]:min-h-7 sm:[&_.week-summary-total]:min-h-8 [&_.week-summary-total]:text-[10px] sm:[&_.week-summary-total]:text-[11px] [&_.week-summary-status]:min-h-7 sm:[&_.week-summary-status]:min-h-8 dark:[&_.week-summary-total]:text-white"

const CALENDAR_MANAGEMENT_CLASS =
  "[&_.calendar-weeks-grid]:w-full [&_.calendar-weeks-grid]:![grid-template-columns:repeat(7,minmax(0,1fr))_minmax(0,1fr)_minmax(0,0.95fr)_minmax(0,1.15fr)] [&_.calendar-weeks-grid]:column-gap-3 [&_.calendar-weeks-grid]:row-gap-3 [&_.week-summary-header]:px-1 [&_.week-summary-header]:leading-tight [&_.week-summary-total]:px-1 [&_.week-summary-status]:px-1 [&_.week-summary-action]:px-1 [&_.day-cell]:size-9 [&_.day-cell]:text-[12px] [&_.week-summary-total]:min-h-9 [&_.week-summary-total]:text-[12px] [&_.week-summary-status]:min-h-9 [&_.week-summary-action]:min-h-9 [&_.week-summary-action]:w-full max-sm:[&_.calendar-weeks-grid]:column-gap-0.5 max-sm:[&_.calendar-weeks-grid]:row-gap-1 max-sm:[&_.week-summary-header]:px-0 max-sm:[&_.week-summary-header]:text-[6.5px] max-sm:[&_.week-summary-total]:px-0 max-sm:[&_.week-summary-status]:px-0 max-sm:[&_.week-summary-action]:px-0 max-sm:[&_.day-cell]:!w-full max-sm:[&_.day-cell]:!h-auto max-sm:[&_.day-cell]:aspect-square max-sm:[&_.day-cell]:max-w-9 max-sm:[&_.day-cell]:text-[8.5px] max-sm:[&_.week-summary-total]:min-h-6 max-sm:[&_.week-summary-total]:text-[8.5px] max-sm:[&_.week-summary-status]:min-h-6 max-sm:[&_.week-summary-action]:min-h-6"

export function PersonalTimeStudyCalendarCard({
  className,
  selectedDate,
  onDateSelect,
  onDayActivate,
  onDayTabOut,
  currentMonthDate,
  onMonthChange,
  dayStatuses,
  weekSummaries,
  showActionColumn,
  renderStatus,
  renderAction,
  variant = "personal",
}: PersonalTimeStudyCalendarCardProps) {
  const resolvedVariant = variant === "management" || showActionColumn ? "management" : "personal"

  return (
    <Card
      className={cn(
        "flex w-full min-w-0 flex-col gap-0 rounded-[10px] border-0 bg-white py-0 shadow-[0_4px_16px_rgba(16,24,40,0.12)] ring-0",
        className,
      )}
      size="sm"
    >
      <CardContent className={cn("px-4 pb-3 pt-3", resolvedVariant === "management" && "px-5 pb-4")}>
        <div className="w-full min-w-0">
          <AppCalender
            showBuiltInLegend={false}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            onDayActivate={onDayActivate}
            onDayTabOut={onDayTabOut}
            currentMonthDate={currentMonthDate}
            onMonthChange={onMonthChange}
            dayStatuses={dayStatuses}
            weekSummaries={weekSummaries}
            showActionColumn={showActionColumn}
            renderStatus={renderStatus}
            renderAction={renderAction}
            className={cn(
              CALENDAR_BASE_CLASS,
              resolvedVariant === "management" ? CALENDAR_MANAGEMENT_CLASS : CALENDAR_PERSONAL_CLASS,
            )}
          />
        </div>
      </CardContent>
    </Card>
  )
}
