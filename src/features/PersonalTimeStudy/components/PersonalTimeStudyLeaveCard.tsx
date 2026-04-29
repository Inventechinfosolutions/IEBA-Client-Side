import { AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { EmployeeLeaveRequestDialog } from "./EmployeeLeaveRequestDialog"

type PersonalTimeStudyLeaveCardProps = {
  leaveCount: number
  approved: number
  open: number
  rejected: number
  className?: string
  dropdownData?: any[]
  onOpen?: () => void
}

export function PersonalTimeStudyLeaveCard({
  leaveCount,
  approved,
  open,
  rejected,
  className,
  dropdownData,
  onOpen,
}: PersonalTimeStudyLeaveCardProps) {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  return (
    <Card
      className={cn("flex h-full min-h-0 flex-col gap-0 border-0 ring-0 py-0 bg-white shadow-[0_4px_16px_rgba(16,24,40,0.12)] rounded-[6px]", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 px-3 pt-2 pb-1">
        <CardTitle className="text-[14px] font-semibold text-foreground">
          Leave Status ({leaveCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 px-3 pt-2 pb-3">
        <ul className="flex flex-col text-[14px] divide-y divide-border/60">
          <li className="flex items-center justify-between gap-2 py-1.5">
            <span className="flex items-center gap-1.5 text-foreground">
              <CheckCircle2 className="size-4 text-green-600" aria-hidden />
              Approved
            </span>
            <span className="tabular-nums text-muted-foreground">{approved}</span>
          </li>
          <li className="flex items-center justify-between gap-2 py-1.5">
            <span className="flex items-center gap-1.5 text-foreground">
              <AlertCircle className="size-4 text-amber-500" aria-hidden />
              Open
            </span>
            <span className="tabular-nums text-muted-foreground">{open}</span>
          </li>
          <li className="flex items-center justify-between gap-2 py-1.5">
            <span className="flex items-center gap-1.5 text-foreground">
              <XCircle className="size-4 text-red-500" aria-hidden />
              Rejected
            </span>
            <span className="tabular-nums text-muted-foreground">{rejected}</span>
          </li>
        </ul>
        <Button
          type="button"
          className="mt-auto w-full bg-[#6C5DD3] hover:bg-[#6C5DD3]/90 rounded-[6px]"
          onClick={() => {
            onOpen?.()
            setLeaveDialogOpen(true)
          }}
        >
          Leave Request
        </Button>
      </CardContent>

      <EmployeeLeaveRequestDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        dropdownData={dropdownData}
        onSave={async () => {
          /* wire save draft API */
        }}
        onSubmit={async () => {
          /* wire submit leave API */
        }}
      />
    </Card>
  )
}
