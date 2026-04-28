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
  className?: string
}

export function PersonalTimeStudyCalendarCard({
  className,
  selectedDate,
  onDateSelect,
  currentMonthDate,
  onMonthChange,
  dayStatuses,
}: PersonalTimeStudyCalendarCardProps) {
  return (
    <Card
      className={cn("flex h-full min-h-0 min-w-0 flex-col gap-0 border-0 ring-0 py-0 bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] rounded-[8px]", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 px-3 pt-2 pb-1">
        <CardTitle className="text-[11px] font-semibold text-foreground">
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-0 pt-0 pb-0">
        <div className="min-h-0 min-w-0 w-full flex-1">
          <AppCalender
            showBuiltInLegend={false}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            currentMonthDate={currentMonthDate}
            onMonthChange={onMonthChange}
            dayStatuses={dayStatuses}
            className="min-h-0 w-full gap-0 [&_.ieba-time-study-calendar]:gap-1 [&_.calendar-card]:rounded-none [&_.calendar-card]:shadow-none [&_.ieba-time-study-calendar]:bg-transparent"
          />
        </div>
      </CardContent>
    </Card>
  )
}
