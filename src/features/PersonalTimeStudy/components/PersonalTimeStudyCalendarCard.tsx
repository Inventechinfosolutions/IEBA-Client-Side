import AppCalender from "@/components/Calender"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { WeekSummaryRow } from "./PersonalTimeStudyWeekSummary"

type PersonalTimeStudyCalendarCardProps = {
  weekRows: WeekSummaryRow[]
  selectedDate?: Date | null
  onDateSelect?: (date: Date) => void
  currentMonthDate?: Date
  onMonthChange?: (date: Date) => void
  dayStatuses?: Record<string, any>
  weekSummaries?: Record<string, any>
  showActionColumn?: boolean
  renderStatus?: (weekIndex: number, dates: Date[], status: any) => React.ReactNode
  renderAction?: (weekIndex: number, dates: Date[], status: any) => React.ReactNode
  className?: string
}

export function PersonalTimeStudyCalendarCard({
  className,
  selectedDate,
  onDateSelect,
  currentMonthDate,
  onMonthChange,
  dayStatuses,
  weekSummaries,
  showActionColumn,
  renderStatus,
  renderAction,
}: PersonalTimeStudyCalendarCardProps) {
  return (
    <Card
      className={cn("flex h-full min-h-0 min-w-0 flex-col gap-0 border-0 ring-0 py-0 bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] rounded-[6px]", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 px-6 pt-6 pb-2">
        <CardTitle className="text-[11px] font-semibold text-foreground">
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-4 pt-2 pb-6">
        <div className="min-h-0 min-w-0 w-full flex-1">
          <AppCalender
            showBuiltInLegend={false}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            currentMonthDate={currentMonthDate}
            onMonthChange={onMonthChange}
            dayStatuses={dayStatuses}
            weekSummaries={weekSummaries}
            showActionColumn={showActionColumn}
            renderStatus={renderStatus}
            renderAction={renderAction}
            className="min-h-0 w-full gap-0 [&_.ieba-time-study-calendar]:gap-1 [&_.calendar-card]:rounded-none [&_.calendar-card]:shadow-none [&_.ieba-time-study-calendar]:bg-transparent"
          />
        </div>
      </CardContent>
    </Card>
  )
}
