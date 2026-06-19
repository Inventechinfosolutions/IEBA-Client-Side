import { useState } from "react"
import { cn } from "@/lib/utils"
import { CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

type PersonalTimeStudyPeriodsSectionProps = {
  timestudyAllowed: Array<{
    departmentId: number
    departmentName: string | null
    allowed: boolean
    startDate: string | null
    endDate: string | null
    message?: string | null
  }>
  dropdownData?: any[]
  className?: string
}

function PeriodCard({
  dept,
  dropdownData,
}: {
  dept: {
    departmentId: number
    departmentName: string | null
    allowed: boolean
    startDate: string | null
    endDate: string | null
    message?: string | null
  }
  dropdownData: any[]
}) {
  const [isOpen, setIsOpen] = useState(false)

  const match = dropdownData.find((d: any) => d.departmentId === dept.departmentId)
  const deptName = dept.departmentName || match?.departmentName || "Assigned Department"

  let statusBadge = null
  let descriptionText = ""
  let isNotAllowed = false

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
    isNotAllowed = true
    statusBadge = (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded border border-destructive/20">
        <ShieldAlert className="size-3 text-destructive" />
        Not Allowed
      </span>
    )
    descriptionText = dept.message || "No time study period allocated."
  }

  const hasHoverMessage = isNotAllowed || (dept.allowed && dept.message)

  return (
    <div
      onMouseEnter={() => {
        if (hasHoverMessage) setIsOpen(true)
      }}
      onMouseLeave={() => {
        if (hasHoverMessage) setIsOpen(false)
      }}
      className={cn(
        "group flex flex-col gap-1 p-2 rounded border border-border/60 bg-slate-50/50 transition-colors",
        hasHoverMessage ? "hover:bg-slate-100/80 cursor-pointer" : "hover:bg-slate-50"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[12px] font-bold text-foreground truncate" title={deptName}>
            {deptName}
          </span>
          {hasHoverMessage && (
            <HoverCard open={isOpen}>
              <HoverCardTrigger asChild>
                <span className="cursor-pointer shrink-0">
                  <AlertTriangle
                    className="size-3.5 text-amber-500 animate-bounce transition-transform duration-700 group-hover:animate-none group-hover:rotate-[360deg] group-hover:scale-125 -translate-y-[2px]"
                  />
                </span>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-fit max-w-[360px] p-3 z-[100] bg-white border border-gray-100 shadow-xl rounded-[8px] text-[#111827] text-[13px]"
                align="start"
                side="top"
              >
                <div className="font-medium text-[#111827]">
                  {(dept.allowed && dept.message) ? dept.message : descriptionText}
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
        {statusBadge}
      </div>
      {isNotAllowed ? (
        <span className="text-[11px] text-muted-foreground font-medium">
          Time Study Not Allowed
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground font-medium">
          {descriptionText}
        </span>
      )}
    </div>
  )
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
          timestudyAllowed.map((dept) => (
            <PeriodCard
              key={dept.departmentId}
              dept={dept}
              dropdownData={dropdownData}
            />
          ))
        )}
      </div>
    </section>
  )
}
