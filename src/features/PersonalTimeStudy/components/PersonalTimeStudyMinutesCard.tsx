import { Card, CardContent } from "@/components/ui/card"
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
      className={cn(
        "flex flex-col gap-0 rounded-[10px] border-0 bg-white py-0 shadow-[0_4px_16px_rgba(16,24,40,0.12)] ring-0",
        className,
      )}
      size="sm"
    >
      <CardContent className="flex flex-col gap-1.5 px-3 py-3">
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
      </CardContent>
    </Card>
  )
}
