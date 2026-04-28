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
      className={cn("flex h-full min-h-0 flex-col gap-0 border-0 ring-0 py-0 bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] rounded-[8px]", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 px-3 pt-2 pb-1">
        <CardTitle className="text-[11px] font-semibold text-foreground">
          Minutes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 px-3 pt-2 pb-3 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Allocated TS Minutes</span>
          <span className="font-semibold tabular-nums text-primary">
            {allocatedMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Actual Minutes</span>
          <span className="font-semibold tabular-nums text-primary">
            {actualMinutes}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <span className="text-muted-foreground">Balance</span>
          <span className="font-semibold tabular-nums text-primary">
            {balanceMinutes}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
