import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { MoreVertical, Edit2, X, MessageCircleMore } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UserLeaveDaySnapshotResDto } from "../types"
import emptyIcon from "@/assets/icons/table-empty.png"

type PendingLeaveRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  leaves: UserLeaveDaySnapshotResDto[]
  onEdit: (leave: UserLeaveDaySnapshotResDto) => void
  onCancel: (leave: UserLeaveDaySnapshotResDto) => void
  dropdownData?: any[]
}

export function PendingLeaveRequestDialog({
  open,
  onOpenChange,
  title,
  leaves,
  onEdit,
  onCancel,
  dropdownData,
}: PendingLeaveRequestDialogProps) {
  const isRejected = title.toLowerCase().includes("rejected")

  const getProgramLabel = (leave: UserLeaveDaySnapshotResDto) => {
    if (dropdownData) {
      for (const bundle of dropdownData) {
        const prog = bundle.programs?.find((p: any) => String(p.id) === String(leave.programid))
        if (prog) {
          const deptPrefix = (bundle.departmentCode ?? '').split('-')[0]
          return `${deptPrefix}-${prog.code} - ${prog.name}`
        }
      }
    }
    // fallback
    return leave.programcode === leave.programname ? leave.programcode : `${leave.programcode} - ${leave.programname}`
  }

  const getActivityLabel = (leave: UserLeaveDaySnapshotResDto) => {
    if (dropdownData) {
      for (const bundle of dropdownData) {
        const act = bundle.activities?.find((a: any) => String(a.id) === String(leave.activityid))
        if (act) {
          return `${act.code} - ${act.name}`
        }
      }
    }
    // fallback
    return `${leave.activitycode} - ${leave.activityname}`
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent overlayClassName="bg-black/55" className="max-w-[1400px] p-0 overflow-hidden sm:rounded-[8px] bg-white">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-center text-lg font-semibold text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="overflow-hidden rounded-[4px] border border-border bg-white">
            {/* Header Table */}
            <div className="overflow-y-hidden [scrollbar-gutter:stable] bg-[#6C5DD3]">
              <Table className="table-fixed border-collapse bg-[#6C5DD3]">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                  {!isRejected && <col style={{ width: "8%" }} />}
                </colgroup>
                <TableHeader className="bg-[#6C5DD3] hover:bg-[#6C5DD3] [&_tr]:border-b-0">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">Date</TableHead>
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">Start Time</TableHead>
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">End Time</TableHead>
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">Program Code</TableHead>
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">Activity Code</TableHead>
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">Total Min.</TableHead>
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">Comment</TableHead>
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">Feedback</TableHead>
                    <TableHead className="text-white text-center font-medium py-3 border-r border-white/60 h-11 px-1 text-[13px]">Status</TableHead>
                    {!isRejected && <TableHead className="text-white text-center font-medium py-3 h-11 px-1 text-[13px]">Action</TableHead>}
                  </TableRow>
                </TableHeader>
              </Table>
            </div>

            {/* Body Table */}
            <div className="max-h-[220px] overflow-y-scroll program-table-scroll [scrollbar-gutter:stable]">
              <Table className="table-fixed border-collapse">
                <colgroup>
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "8%" }} />
                  <col style={{ width: "10%" }} />
                  {!isRejected && <col style={{ width: "8%" }} />}
                </colgroup>
                <TableBody>
                  {leaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isRejected ? 9 : 10} className="h-32 text-center text-muted-foreground border-b-0 bg-white">
                        <div className="flex flex-col items-center justify-center gap-4">
                          <img src={emptyIcon} alt="No data" className="size-24 opacity-90" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaves.map((leave, index) => (
                      <TableRow 
                        key={leave.id} 
                        className={cn(
                          "bg-white border-border hover:bg-[#fafafa] min-h-[44px]",
                          index === leaves.length - 1 ? "border-b-0" : "border-b"
                        )}
                      >
                        <TableCell className="text-center py-2 border-r border-border/70 text-[12px] px-1">{leave.startdt}</TableCell>
                        <TableCell className="text-center py-2 border-r border-border/70 text-[12px] px-1">{leave.starttime?.slice(0, 5)}</TableCell>
                        <TableCell className="text-center py-2 border-r border-border/70 text-[12px] px-1">{leave.endtime?.slice(0, 5)}</TableCell>
                        <TableCell className="text-center py-2 border-r border-border/70 text-[12px] px-2 font-medium text-foreground/80 break-words whitespace-normal">
                          {getProgramLabel(leave)}
                        </TableCell>
                        <TableCell className="text-center py-2 border-r border-border/70 text-[12px] px-2 break-words whitespace-normal">
                          {getActivityLabel(leave)}
                        </TableCell>
                        <TableCell className="text-center py-2 border-r border-border/70 text-[12px] px-1">{leave.leaveTotalTime}</TableCell>
                        <TableCell className="text-center py-2 border-r border-border/70 px-1">
                          {leave.requestcomment ? (
                            <div className="flex justify-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <MessageCircleMore className="size-4 text-[#6C5DD3] cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-[#1E293B] text-white">
                                  <p className="text-[12px]">{leave.requestcomment}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <MessageCircleMore className="size-4 text-[#6C5DD3]/30" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center py-1 border-r border-border/70 px-1">
                          {leave.supervisorcomment ? (
                            <div className="flex justify-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <MessageCircleMore className="size-4 text-[#6C5DD3] cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-[#1E293B] text-white">
                                  <p className="text-[12px]">{leave.supervisorcomment}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          ) : (
                            <div className="flex justify-center">
                              <MessageCircleMore className="size-4 text-[#6C5DD3]/30" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className={cn("text-center py-1 px-1", !isRejected && "border-r border-border/70")}>
                          <span className={cn(
                            "px-4 py-1 rounded-[6px] text-[12px]  border-1 bg-white text-[#111827] capitalize",
                            leave.status?.toLowerCase() === "approved" ? "border-[#22c55e]" :
                            leave.status?.toLowerCase() === "rejected" ? "border-[#ef4444]" :
                            "border-[#f59e0b]"
                          )}>
                            {leave.status}
                          </span>
                        </TableCell>
                        {!isRejected && (
                          <TableCell className="text-center py-1 px-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7">
                                  <MoreVertical className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white min-w-[135px] p-1.5">
                                <DropdownMenuItem onClick={() => onEdit(leave)} className="cursor-pointer gap-2.5 text-[#1E293B] font-medium py-1 text-[13px]">
                                  <Edit2 className="size-3.5 text-[#6C5DD3]" />
                                  <span>Edit Leave</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onCancel(leave)} className="cursor-pointer gap-2.5 text-[#1E293B] font-medium py-1 whitespace-nowrap text-[13px]">
                                  <X className="size-3.5 text-[#6C5DD3]" />
                                  <span>Cancel Leave</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 sm:justify-end bg-white">
          <Button 
            onClick={() => onOpenChange(false)}
            className="min-w-[120px] bg-[#6C5DD3] hover:bg-[#5b4eb3] text-white rounded-[6px] font-medium"
          >
            Exit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </TooltipProvider>
  )
}
