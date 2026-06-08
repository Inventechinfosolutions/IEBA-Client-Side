import { cn } from "@/lib/utils"
import { CheckCircle2, ShieldAlert } from "lucide-react"

type PersonalTimeStudyPeriodsSectionProps = {
  timestudyAllowed: Array<{
    departmentId: number
    departmentName: string | null
    allowed: boolean
    startDate: string | null
    endDate: string | null
  }>
  dropdownData?: any[]
  className?: string
}

export function PersonalTimeStudyPeriodsSection({
  timestudyAllowed = [],
  dropdownData = [],
  className,
}: PersonalTimeStudyPeriodsSectionProps) {
  return (
    <section
      className={cn(
        "relative flex w-full flex-col rounded-[6px] border-0 ring-0 bg-white p-3 shadow-[0_4px_16px_rgba(16,24,40,0.12)] h-[180px]",
        className
      )}
    >
      <h2 className="mb-1 shrink-0 text-[14px] font-bold text-[#6C5DD3]">
        Time Study Periods
      </h2>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 scrollbar-thin max-h-[200px]">
        {timestudyAllowed.length === 0 ? (
          <div className="text-[11px] text-muted-foreground py-2 italic">
            No department assignments found.
          </div>
        ) : (
          timestudyAllowed.map((dept) => {
            const match = dropdownData.find((d: any) => d.departmentId === dept.departmentId)
            const deptName = dept.departmentName || match?.departmentName || "Assigned Department"

            let statusBadge = null
            let descriptionText = ""

            if (dept.allowed) {
              if (dept.startDate) {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Allowed
                  </span>
                )
                descriptionText = `Period: ${dept.startDate} to ${dept.endDate}`
              } else {
                statusBadge = (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <CheckCircle2 className="size-3 text-emerald-600" />
                    Allowed
                  </span>
                )
                descriptionText = "Time Study Allowed"
              }
            } else {
              statusBadge = (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
                  <ShieldAlert className="size-3 text-destructive" />
                  Not Allowed
                </span>
              )
              descriptionText = "No time study period allocated."
            }

            return (
              <div
                key={dept.departmentId}
                className="flex flex-col gap-1 p-2 rounded border border-border/60 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold text-foreground truncate" title={deptName}>
                    {deptName}
                  </span>
                  {statusBadge}
                </div>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {descriptionText}
                </span>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

