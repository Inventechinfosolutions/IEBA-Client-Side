import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { AlertCircle } from "lucide-react"

type PersonalTimeStudyMinutesCardProps = {
  allocatedMinutes: number
  actualMinutes: number
  balanceMinutes: number
  totalMAAMinutes?: number
  className?: string
  apportioningSummary?: Array<{
    departmentId: number
    departmentName: string
    apportioningPercent: number
    allocatedMinutes: number
    enteredMinutes: number
    remainingMinutes: number
    apportioningType?: string
    supervisorConsumedMinutes?: number
  }>
}

export function PersonalTimeStudyMinutesCard({
  allocatedMinutes,
  actualMinutes,
  balanceMinutes,
  totalMAAMinutes,
  className,
  apportioningSummary,
}: PersonalTimeStudyMinutesCardProps) {
  const maaBalance = actualMinutes - (totalMAAMinutes || 0);

  return (
    <Card
      className={cn(
        "flex flex-col gap-0 rounded-[10px] border-0 bg-white py-0 shadow-[0_4px_16px_rgba(16,24,40,0.12)] ring-0",
        className,
      )}
      size="sm"
    >
      <CardHeader className="shrink-0 px-3 pb-1 pt-2">
        <CardTitle className="text-left text-[13px] font-semibold text-[#6C5DD3]">
          Minutes Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-3 pb-3 pt-1">
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-semibold text-[#111827]">Allocated TS Minutes:</span>
          <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
            {allocatedMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-semibold text-[#111827]">Entered TS Minutes:</span>
          <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
            {actualMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-semibold text-[#111827]">TS Balance:</span>
          <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
            {balanceMinutes}
          </span>
        </div>

        <hr className="my-0.5 border-[#E5E7EB]" />

        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-semibold text-[#111827]">Entered MAA Minutes:</span>
          <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
            {totalMAAMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-semibold text-[#111827]">MAA Balance:</span>
          <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
            {maaBalance}
          </span>
        </div>

        {apportioningSummary && apportioningSummary.length > 0 && (
          <>
            <hr className="my-0.5 border-[#E5E7EB]" />
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-semibold text-[#111827]">Apportioned Minutes:</span>
              <HoverCard openDelay={0} closeDelay={100}>
                <HoverCardTrigger asChild>
                  <div className="cursor-pointer text-blue-500 hover:text-blue-600 transition-colors flex items-center shrink-0">
                    <AlertCircle className="size-3.5" />
                  </div>
                </HoverCardTrigger>
                <HoverCardContent
                  className="w-fit min-w-[340px] max-w-sm p-3 z-[100] bg-white border border-gray-100 shadow-xl rounded-[8px] text-[#111827]"
                  align="end"
                  side="top"
                >
                  <div className="text-[11px] font-medium space-y-2">
                    {apportioningSummary.map((item) => (
                      <div key={item.departmentId} className="border-b last:border-b-0 pb-1.5 last:pb-0 border-gray-100">
                        <div className="font-bold text-[#6C5DD3] text-[12px] flex items-center justify-between gap-2">
                          <span>{item.departmentName}</span>
                          {item.apportioningType && item.apportioningType !== "none" && (
                            <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 font-mono">
                              {item.apportioningType}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-[#344054]">
                          <div>
                            <span className="text-muted-foreground font-medium">Percent:</span>{" "}
                            <span className="font-semibold text-foreground">{item.apportioningPercent}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Allocated:</span>{" "}
                            <span className="font-semibold text-foreground">{item.allocatedMinutes} Min.</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground font-medium">Supervisor Consumed:</span>{" "}
                            <span className="font-semibold text-[#6C5DD3]">{item.supervisorConsumedMinutes ?? 0} Min.</span>
                          </div>
                          {item.apportioningType !== "manual" && (
                            <div>
                              <span className="text-muted-foreground font-medium">Reportee Minutes:</span>{" "}
                              <span className="font-semibold text-[#6C5DD3]">{item.enteredMinutes} Min.</span>
                            </div>
                          )}
                          <div>
                            <span className="text-muted-foreground font-medium">Remaining:</span>{" "}
                            <span className="font-semibold text-[#6C5DD3]">{item.remainingMinutes} Min.</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
