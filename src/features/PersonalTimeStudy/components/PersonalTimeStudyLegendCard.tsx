import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { PERSONAL_TIME_STUDY_LEGEND } from "../constants"

const LEGEND_ITEMS: {
  key: keyof typeof PERSONAL_TIME_STUDY_LEGEND
  label: string
}[] = [
  { key: "approvedTimeEntry", label: "Approved Time Entry" },
  { key: "lessHours", label: "Less Hours" },
  { key: "moreHours", label: "More Hours" },
  { key: "equalHours", label: "Equal hours" },
]

type PersonalTimeStudyLegendCardProps = {
  className?: string
}

export function PersonalTimeStudyLegendCard({
  className,
}: PersonalTimeStudyLegendCardProps) {
  return (
    <Card
      className={cn("flex h-full min-h-0 flex-col shadow-sm", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 border-b border-border/60 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Status legend
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="flex flex-col gap-3">
          {LEGEND_ITEMS.map(({ key, label }) => (
            <li key={key} className="flex items-center gap-3 text-sm">
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: PERSONAL_TIME_STUDY_LEGEND[key] }}
              >
                1
              </span>
              <span className="text-foreground">{label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
