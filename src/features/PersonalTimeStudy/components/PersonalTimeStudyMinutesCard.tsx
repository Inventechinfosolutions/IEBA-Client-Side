import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { AlertCircle } from "lucide-react"
import { formatDecimalHours } from "../utils/decimalTimeHint"
import { useState } from "react"

type PersonalTimeStudyMinutesCardProps = {
  allocatedMinutes: number
  actualMinutes: number
  balanceMinutes: number
  totalMAAMinutes?: number | null
  className?: string
  showHoursMode?: boolean
  apportioningSummary?: Array<{
    departmentId: number
    departmentName: string
    apportioningPercent: number
    allocatedMinutes: number
    enteredMinutes: number
    remainingMinutes: number
    apportioningType?: string
    supervisorConsumedMinutes?: number
    outOfDateRange?: boolean
    startDate?: string | null
    endDate?: string | null
    message?: string | null
  }>
  hideApportionedMinutes?: boolean
}

export function PersonalTimeStudyMinutesCard({
  allocatedMinutes,
  actualMinutes,
  balanceMinutes,
  totalMAAMinutes,
  className,
  showHoursMode = false,
  apportioningSummary,
  hideApportionedMinutes = false,
}: PersonalTimeStudyMinutesCardProps) {
  const maaBalance = totalMAAMinutes !== null && totalMAAMinutes !== undefined ? actualMinutes - totalMAAMinutes : null;

  // Convert minutes to decimal hours for display
  const toHrs = (mins: number) => formatDecimalHours(mins / 60)

  const [hintOpen, setHintOpen] = useState(false)

  return (
    <Card
      className={cn(
        "flex flex-col gap-0 rounded-[10px] border-0 bg-white py-0 shadow-[0_4px_16px_rgba(16,24,40,0.12)] ring-0",
        className,
      )}
      size="sm"
    >
      <CardHeader className="shrink-0 px-3 pb-1 pt-2">
        <CardTitle className="text-left text-[13px] font-semibold text-[#6C5DD3] flex items-center justify-between">
          <span>{showHoursMode ? "Hours Summary" : "Minutes Summary"}</span>
          {showHoursMode && (
            <HoverCard open={hintOpen} onOpenChange={setHintOpen} openDelay={0} closeDelay={100}>
              <HoverCardTrigger asChild>
                <div
                  className="cursor-pointer text-[#6C5DD3] hover:text-[#5B4DBF] transition-colors flex items-center shrink-0"
                  onClick={() => setHintOpen((v) => !v)}
                >
                  <AlertCircle className="size-4.5 animate-bounce" />
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                className="w-fit min-w-[240px] p-3 z-[100] bg-white border border-gray-100 shadow-xl rounded-[8px] text-[#111827]"
                align="end"
                side="top"
              >
                <div className="text-[11px] font-medium space-y-1.5">
                  <p className="text-[10px] text-[#6C5DD3] font-semibold uppercase tracking-wide mb-2">In Minutes</p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Allocated TS:</span>
                    <span className="font-semibold text-[#6C5DD3]">{allocatedMinutes} mins</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">Entered TS:</span>
                    <span className="font-semibold text-[#6C5DD3]">{actualMinutes} mins</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground">TS Balance:</span>
                    <span className="font-semibold text-[#6C5DD3]">{balanceMinutes} mins</span>
                  </div>
                  {totalMAAMinutes !== null && totalMAAMinutes !== undefined && (
                    <>
                      <hr className="border-gray-100 my-1" />
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Entered MAA:</span>
                        <span className="font-semibold text-[#6C5DD3]">{totalMAAMinutes} mins</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">MAA Balance:</span>
                        <span className="font-semibold text-[#6C5DD3]">{maaBalance} mins</span>
                      </div>
                    </>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-3 pb-3 pt-1">
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-semibold text-[#111827]">
            {showHoursMode ? "Allocated TS Hours:" : "Allocated TS Minutes:"}
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
            {showHoursMode ? toHrs(allocatedMinutes) : allocatedMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-semibold text-[#111827]">
            {showHoursMode ? "Entered TS Hours:" : "Entered TS Minutes:"}
          </span>
          <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
            {showHoursMode ? toHrs(actualMinutes) : actualMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[12px]">
          <span className="font-semibold text-[#111827]">TS Balance:</span>
          <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
            {showHoursMode ? toHrs(balanceMinutes) : balanceMinutes}
          </span>
        </div>

        {totalMAAMinutes !== null && totalMAAMinutes !== undefined && (
          <>
            <hr className="my-0.5 border-[#E5E7EB]" />
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-semibold text-[#111827]">
                {showHoursMode ? "Entered MAA Hours:" : "Entered MAA Minutes:"}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
                {showHoursMode ? toHrs(totalMAAMinutes) : totalMAAMinutes}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 text-[12px]">
              <span className="font-semibold text-[#111827]">MAA Balance:</span>
              <span className="shrink-0 font-semibold tabular-nums text-[#6C5DD3]">
                {showHoursMode ? toHrs(maaBalance ?? 0) : maaBalance}
              </span>
            </div>
          </>
        )}

        {!hideApportionedMinutes && apportioningSummary && apportioningSummary.length > 0 && (
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
                      <div key={item.departmentId} className="border-b last:border-b-0 pb-2 last:pb-0 border-gray-100">
                        <div className="font-bold text-[#6C5DD3] text-[12px] flex items-center justify-between gap-2">
                          <span className="flex-1">{item.departmentName}</span>
                          {item.apportioningType && item.apportioningType !== "none" && (
                            <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 font-mono shrink-0">
                              {item.apportioningType}
                            </span>
                          )}
                        </div>
                        {item.outOfDateRange ? (
                          <div className="w-full">
                            <div className="col-span-2 mt-1 mb-1.5 text-[#344054]">
                              <span className="text-muted-foreground font-medium">Period:</span>{" "}
                              <span className="font-semibold text-foreground">
                                {item.startDate ?? <span className="text-gray-400 italic text-[11px]">Not Configured</span>}
                                {" to "}
                                {item.endDate ?? <span className="text-gray-400 italic text-[11px]">Not Configured</span>}
                              </span>
                            </div>
                            <p
                              className="mt-1.5 mb-1 text-[12px] text-gray-700 font-medium leading-snug w-full"
                              dangerouslySetInnerHTML={{ __html: `<b>Note:</b> ${item.message}` }}
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-[#344054]">
                            <div>
                              <span className="text-muted-foreground font-medium">Start Date:</span>{" "}
                              {item.startDate
                                ? <span className="font-semibold text-foreground">{item.startDate}</span>
                                : <span className="text-gray-400 italic text-[11px]">Not Configured</span>
                              }
                            </div>
                            <div>
                              <span className="text-muted-foreground font-medium">End Date:</span>{" "}
                              {item.endDate
                                ? <span className="font-semibold text-foreground">{item.endDate}</span>
                                : <span className="text-gray-400 italic text-[11px]">Not Configured</span>
                              }
                            </div>
                            <div>
                              <span className="text-muted-foreground font-medium">Percent:</span>{" "}
                              <span className="font-semibold text-foreground">{item.apportioningPercent}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground font-medium">Allocated:</span>{" "}
                              <span className="font-semibold text-foreground">{item.allocatedMinutes} Min.</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground font-medium">Supervisor Consumed:</span>{" "}
                              <span className="font-semibold text-[#6C5DD3]">{item.supervisorConsumedMinutes ?? 0} Min.</span>
                            </div>
                            {item.apportioningType !== "manual" && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground font-medium">Reportee Minutes:</span>{" "}
                                <span className="font-semibold text-[#6C5DD3]">{item.enteredMinutes} Min.</span>
                              </div>
                            )}
                            <div className="col-span-2 border-t border-gray-100 pt-1 mt-0.5">
                              <span className="text-muted-foreground font-medium">Remaining:</span>{" "}
                              <span className="font-semibold text-[#6C5DD3]">{item.remainingMinutes} Min.</span>
                            </div>
                          </div>
                        )}
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
