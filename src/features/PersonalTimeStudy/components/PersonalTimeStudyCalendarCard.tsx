import AppCalender from "@/components/Calender"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { WeekSummaryRow } from "./PersonalTimeStudyWeekSummary"

type PersonalTimeStudyCalendarCardProps = {
  weekRows: WeekSummaryRow[]
  className?: string
}

export function PersonalTimeStudyCalendarCard({
  className,
}: PersonalTimeStudyCalendarCardProps) {
  return (
    <Card
      className={cn("flex h-full min-h-0 min-w-0 flex-col shadow-sm", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 border-b border-border/60 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4 px-0 pt-2 pb-3 md:flex-row md:items-stretch md:gap-0 md:pt-0 md:pb-3">
        <div className="min-h-0 min-w-0 w-full flex-1">
          <AppCalender
            showBuiltInLegend={false}
            className="min-h-0 w-full gap-0 [&_.calendar-card]:rounded-none [&_.calendar-card]:shadow-none [&_.ieba-time-study-calendar]:bg-transparent"
          />
        </div>
        {/* <PersonalTimeStudyWeekSummary weeks={weekRows} /> */}
      </CardContent>
    </Card>
  )
}
