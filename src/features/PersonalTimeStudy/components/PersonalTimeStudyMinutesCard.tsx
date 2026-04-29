import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PersonalTimeStudyMinutesCardProps = {
  allocatedMinutes: number
  actualMinutes: number
  balanceMinutes: number
  className?: string
}

export function PersonalTimeStudyMinutesCard({
  allocatedMinutes,
  actualMinutes,
  balanceMinutes,
  className,
}: PersonalTimeStudyMinutesCardProps) {
  return (
    <Card
      className={cn("flex h-full min-h-0 flex-col gap-0 border-0 ring-0 py-0 bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] rounded-[6px]", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 px-3 pt-2 pb-1">
        <CardTitle className="text-[12px] font-semibold text-foreground">
          Minutes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-3 pt-2 pb-3 text-[12px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-bold text-black">Allocated TS Minutes</span>
          <span className="text-[14px] font-semibold tabular-nums text-[#6C5DD3]">
            {allocatedMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[14px] font-bold text-black">Actual Minutes</span>
          <span className="text-[14px] font-semibold tabular-nums text-[#6C5DD3]">
            {actualMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <span className="text-[14px] font-bold text-black">Balance</span>
          <span className="text-[14px] font-semibold tabular-nums text-[#6C5DD3]">
            {balanceMinutes}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
