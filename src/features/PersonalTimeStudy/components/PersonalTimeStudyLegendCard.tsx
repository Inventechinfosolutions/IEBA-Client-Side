import { Card, CardContent } from "@/components/ui/card"
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
      className={cn(
        "flex flex-col gap-0 rounded-[10px] border-0 bg-white py-0 shadow-[0_4px_16px_rgba(16,24,40,0.12)] ring-0",
        className,
      )}
      size="sm"
    >
      <CardContent className="px-3 py-3">
        <ul className="flex flex-col gap-2">
          {LEGEND_ITEMS.map(({ key, label }) => (
            <li key={key} className="flex items-center gap-2.5 text-[13px]">
              <span
                className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style={{ backgroundColor: PERSONAL_TIME_STUDY_LEGEND[key] }}
              >
                1
              </span>
              <span style={{ color: PERSONAL_TIME_STUDY_LEGEND[key] }}>{label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

