import { cn } from "@/lib/utils"

import { PERSONAL_TIME_STUDY_LEGEND } from "../constants"

export type WeekSummaryRow = {
  id: string
  totalMin: number
  /** Visual hint for STATUS column — wire to real status later */
  status: "less" | "more" | "equal" | "neutral"
}

const STATUS_DOT: Record<WeekSummaryRow["status"], string> = {
  less: PERSONAL_TIME_STUDY_LEGEND.lessHours,
  more: PERSONAL_TIME_STUDY_LEGEND.moreHours,
  equal: PERSONAL_TIME_STUDY_LEGEND.equalHours,
  neutral: PERSONAL_TIME_STUDY_LEGEND.approvedTimeEntry,
}

type PersonalTimeStudyWeekSummaryProps = {
  weeks: WeekSummaryRow[]
  className?: string
}

/**
 * Placeholder week totals + STATUS column (reference UI).
 * Hook to real calendar weeks when backend is ready.
 */
export function PersonalTimeStudyWeekSummary({
  weeks,
  className,
}: PersonalTimeStudyWeekSummaryProps) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto md:w-auto md:min-w-[112px] md:max-w-[160px] md:shrink-0 md:border-l md:border-border md:pl-4",
        className
      )}
    >
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="pb-2 pr-2 font-medium">TOTAL(MIN.)</th>
            <th className="pb-2 font-medium">STATUS</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((row) => (
            <tr key={row.id} className="border-b border-border/60 last:border-0">
              <td className="py-2 pr-2 tabular-nums text-foreground">
                {row.totalMin}
              </td>
              <td className="py-2">
                <span
                  className="inline-block size-3 rounded-full"
                  style={{ backgroundColor: STATUS_DOT[row.status] }}
                  title={row.status}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
