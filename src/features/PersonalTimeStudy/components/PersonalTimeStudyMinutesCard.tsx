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
      className={cn("flex h-full min-h-0 flex-col shadow-sm", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 border-b border-border/60 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Minutes
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pt-4 text-sm">
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
