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
      className={cn("flex h-full min-h-0 flex-col gap-0 border-0 ring-0 py-0 bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] rounded-[6px]", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 px-3 pt-2 pb-1">
        <CardTitle className="text-[14px] font-semibold text-foreground">
          Status legend
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pt-1 pb-3">
        <ul className="flex flex-col gap-1.5">
          {LEGEND_ITEMS.map(({ key, label }) => (
            <li key={key} className="flex items-center gap-1.5 text-[14px]">
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: PERSONAL_TIME_STUDY_LEGEND[key] }}
              >
                1
              </span>
              <span 
                style={{ color: PERSONAL_TIME_STUDY_LEGEND[key] }}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
