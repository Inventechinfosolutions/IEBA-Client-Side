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
}

export function PersonalTimeStudyLeaveCard({
  leaveCount,
  approved,
  open,
  rejected,
  className,
}: PersonalTimeStudyLeaveCardProps) {
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false)

  return (
    <Card
      className={cn("flex h-full min-h-0 flex-col shadow-sm", className)}
      size="sm"
    >
      <CardHeader className="shrink-0 border-b border-border/60 pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          Leave Status ({leaveCount})
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4 pt-4">
        <ul className="flex flex-col gap-2 text-sm">
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-foreground">
              <CheckCircle2 className="size-4 text-green-600" aria-hidden />
              Approved
            </span>
            <span className="tabular-nums text-muted-foreground">({approved})</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-foreground">
              <AlertCircle className="size-4 text-amber-500" aria-hidden />
              Open
            </span>
            <span className="tabular-nums text-muted-foreground">({open})</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-foreground">
              <XCircle className="size-4 text-red-500" aria-hidden />
              Rejected
            </span>
            <span className="tabular-nums text-muted-foreground">({rejected})</span>
          </li>
        </ul>
        <Button
          type="button"
          className="mt-auto w-full"
          onClick={() => setLeaveDialogOpen(true)}
        >
          Leave Request
        </Button>
      </CardContent>

      <EmployeeLeaveRequestDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
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
