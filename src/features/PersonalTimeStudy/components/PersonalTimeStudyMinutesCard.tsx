import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PersonalTimeStudyMinutesCardProps = {
  allocatedMinutes: number
  actualMinutes: number
  balanceMinutes: number
  totalMAAMinutes?: number
  className?: string
}

export function PersonalTimeStudyMinutesCard({
  allocatedMinutes,
  actualMinutes,
  balanceMinutes,
  totalMAAMinutes,
  className,
}: PersonalTimeStudyMinutesCardProps) {
  const maaBalance = actualMinutes - (totalMAAMinutes || 0);

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
      <CardContent className="flex flex-col gap-2 px-3 pt-2 pb-4">
        <div className="flex items-center justify-end gap-2 text-[14px]">
          <span className="font-semibold text-black">Allocated TS Minutes:</span>
          <span className="font-semibold tabular-nums text-[#6C5DD3]">
            {allocatedMinutes}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2 text-[14px]">
          <span className="font-semibold text-black">Entered TS Minutes:</span>
          <span className="font-semibold tabular-nums text-[#6C5DD3]">
            {actualMinutes}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2 text-[14px]">
          <span className="font-semibold text-black">TS Balance:</span>
          <span className="font-semibold tabular-nums text-[#6C5DD3]">
            {balanceMinutes}
          </span>
        </div>

        <hr className="border-border/60" />

        <div className="flex items-center justify-end gap-2 text-[14px]">
          <span className="font-semibold text-black">Entered MAA Minutes:</span>
          <span className="font-semibold tabular-nums text-[#6C5DD3]">
            {totalMAAMinutes}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2 text-[14px]">
          <span className="font-semibold text-black">MAA Balance:</span>
          <span className="font-semibold tabular-nums text-[#6C5DD3]">
            {maaBalance}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
