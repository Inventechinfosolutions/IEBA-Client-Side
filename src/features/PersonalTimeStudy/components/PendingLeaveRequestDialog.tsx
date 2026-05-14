import { Fragment, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronDown, ChevronRight, Edit2, MessageCircleMore, MoreVertical, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  assignSyntheticParentIdsByTimeSlot,
  groupUserLeaveRows,
  type UserLeaveMultiCodeFragment,
} from "@/lib/groupUserLeaveRows"
import type { UserLeaveDaySnapshotResDto } from "../types"
import emptyIcon from "@/assets/icons/table-empty.png"
import { Spinner } from "@/components/ui/spinner"

function syntheticSnapshotChild(
  parent: UserLeaveDaySnapshotResDto,
  mc: UserLeaveMultiCodeFragment,
  index: number,
): UserLeaveDaySnapshotResDto {
  const id = mc.id ?? -(Math.abs(parent.id) * 10_000 + index + 1)
  const num = (v: unknown, fallback: number) => {
    if (v === undefined || v === null || v === "") return fallback
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
  }
  return {
    ...parent,
    id,
    parentId: parent.id,
    recordType: "MULTI_CODE",
    programid: num(mc.programid, parent.programid),
    activityid: num(mc.activityid, parent.activityid),
    programcode: mc.programcode ?? parent.programcode,
    programname: mc.programname ?? parent.programname,
    activitycode: mc.activitycode ?? parent.activitycode,
    activityname: mc.activityname ?? parent.activityname,
    leaveTotalTime: mc.leaveTotalTime ?? parent.leaveTotalTime,
    requestcomment: mc.requestcomment ?? parent.requestcomment,
  }
}

type PendingLeaveRequestDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  leaves: UserLeaveDaySnapshotResDto[]
  onEdit: (leave: UserLeaveDaySnapshotResDto) => void
  onCancel: (leave: UserLeaveDaySnapshotResDto) => void
  dropdownData?: any[]
  isLoading?: boolean
}

export function PendingLeaveRequestDialog({
  open,
  onOpenChange,
  title,
  leaves,
  onEdit,
  onCancel,
  dropdownData,
  isLoading = false,
}: PendingLeaveRequestDialogProps) {
  const isRejected = title.toLowerCase().includes("rejected")
  const [expandedByParentId, setExpandedByParentId] = useState<Record<number, boolean>>({})

  const preparedLeaves = useMemo(() => assignSyntheticParentIdsByTimeSlot(leaves), [leaves])
  const groupedLeaves = useMemo(
    () => groupUserLeaveRows(preparedLeaves, { synthesizeChild: syntheticSnapshotChild }),
    [preparedLeaves],
  )

  const toggleExpanded = (parentId: number) => {
    setExpandedByParentId((prev) => ({ ...prev, [parentId]: !prev[parentId] }))
  }

  const getProgramLabel = (leave: UserLeaveDaySnapshotResDto) => {
    if (dropdownData) {
      for (const bundle of dropdownData) {
        const prog = bundle.programs?.find((p: any) => String(p.id) === String(leave.programid))
        if (prog) {
          const deptPrefix = (bundle.departmentCode ?? "").split("-")[0]
          return `${deptPrefix}-${prog.code} - ${prog.name}`
        }
      }
    }
    return leave.programcode === leave.programname
      ? leave.programcode
      : `${leave.programcode} - ${leave.programname}`
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
    return `${leave.activitycode} - ${leave.activityname}`
  }

  return (
    <TooltipProvider delayDuration={100}>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          overlayClassName="bg-black/55"
          className="max-w-[1400px] p-0 overflow-hidden sm:rounded-[8px] bg-white"
        >
          <DialogHeader className="px-6 py-4">
            <DialogTitle className="text-center text-lg font-semibold text-foreground">
              {title}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4">
            <div className="overflow-hidden rounded-[4px] border border-border bg-white">
              <div className="overflow-y-hidden [scrollbar-gutter:stable] bg-[#6C5DD3]">
                <Table className="table-fixed border-collapse bg-[#6C5DD3]">
                  <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "9%" }} />
                    {!isRejected && <col style={{ width: "8%" }} />}
                  </colgroup>
                  <TableHeader className="bg-[#6C5DD3] hover:bg-[#6C5DD3] [&_tr]:border-b-0">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="h-11 border-r border-white/60 px-0 py-3 text-center text-[13px] font-medium text-white">
                        <span className="sr-only">Expand</span>
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        Date
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        Start Time
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        End Time
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        Program Code
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        Activity Code
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        Total Min.
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        Comment
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        Feedback
                      </TableHead>
                      <TableHead className="h-11 border-r border-white/60 px-1 py-3 text-center text-[13px] font-medium text-white">
                        Status
                      </TableHead>
                      {!isRejected && (
                        <TableHead className="h-11 px-1 py-3 text-center text-[13px] font-medium text-white">
                          Action
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                </Table>
              </div>

              <div className="max-h-[220px] overflow-y-scroll program-table-scroll [scrollbar-gutter:stable]">
                <Table className="table-fixed border-collapse">
                  <colgroup>
                    <col style={{ width: "4%" }} />
                    <col style={{ width: "9%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "7%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "8%" }} />
                    <col style={{ width: "9%" }} />
                    {!isRejected && <col style={{ width: "8%" }} />}
                  </colgroup>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell
                          colSpan={isRejected ? 10 : 11}
                          className="h-32 border-b-0 bg-white text-center"
                        >
                          <div className="flex flex-col items-center justify-center">
                            <Spinner className="size-8 text-[#6C5DD3]" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : leaves.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={isRejected ? 10 : 11}
                          className="h-32 border-b-0 bg-white text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-4">
                            <img src={emptyIcon} alt="No data" className="size-24 opacity-90" />
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedLeaves.map(({ parent, children }, gIdx) => {
                        const expanded = !!expandedByParentId[parent.id]
                        const hasChildren = children.length > 0
                        const isLastGroup = gIdx === groupedLeaves.length - 1
                        const parentRowBorder =
                          isLastGroup && (!expanded || !hasChildren) ? "border-b-0" : "border-b"

                        const renderDataCells = (leave: UserLeaveDaySnapshotResDto, isChild: boolean) => (
                          <>
                            <TableCell
                              className={cn(
                                "border-r border-border/70 px-1 py-2 text-center text-[12px]",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              {isChild ? (
                                <span className="sr-only">Same date as parent row</span>
                              ) : (
                                leave.startdt
                              )}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "border-r border-border/70 px-1 py-2 text-center text-[12px]",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              {isChild ? (
                                <span className="sr-only">Same start time as parent row</span>
                              ) : (
                                leave.starttime?.slice(0, 5)
                              )}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "border-r border-border/70 px-1 py-2 text-center text-[12px]",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              {isChild ? (
                                <span className="sr-only">Same end time as parent row</span>
                              ) : (
                                leave.endtime?.slice(0, 5)
                              )}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "border-r border-border/70 px-2 py-2 text-center text-[12px] font-medium text-foreground/80 break-words whitespace-normal",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              {getProgramLabel(leave)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "border-r border-border/70 px-2 py-2 text-center text-[12px] break-words whitespace-normal",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              {getActivityLabel(leave)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "border-r border-border/70 px-1 py-2 text-center text-[12px]",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              {leave.leaveTotalTime}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "border-r border-border/70 px-1 py-2 text-center",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              {leave.requestcomment ? (
                                <div className="flex justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <MessageCircleMore className="size-4 cursor-pointer text-[#6C5DD3]" />
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
                            <TableCell
                              className={cn(
                                "border-r border-border/70 px-1 py-1 text-center",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              {leave.supervisorcomment ? (
                                <div className="flex justify-center">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <MessageCircleMore className="size-4 cursor-pointer text-[#6C5DD3]" />
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
                            <TableCell
                              className={cn(
                                "px-1 py-1 text-center",
                                !isRejected && "border-r border-border/70",
                                isChild && "bg-[#f8f7fc]/90",
                              )}
                            >
                              <span
                                className={cn(
                                  "border-1 rounded-[6px] bg-white px-4 py-1 text-[12px] capitalize text-[#111827]",
                                  leave.status?.toLowerCase() === "approved"
                                    ? "border-[#22c55e]"
                                    : leave.status?.toLowerCase() === "rejected"
                                      ? "border-[#ef4444]"
                                      : "border-[#f59e0b]",
                                )}
                              >
                                {leave.status}
                              </span>
                            </TableCell>
                            {!isRejected && (
                              <TableCell className={cn("px-1 py-1 text-center", isChild && "bg-[#f8f7fc]/90")}>
                                {isChild ? (
                                  <span className="text-[11px] text-muted-foreground">—</span>
                                ) : (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="size-7">
                                        <MoreVertical className="size-3.5" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="min-w-[135px] bg-white p-1.5">
                                      <DropdownMenuItem
                                        onClick={() => onEdit(parent)}
                                        className="cursor-pointer gap-2.5 py-1 text-[13px] font-medium text-[#1E293B]"
                                      >
                                        <Edit2 className="size-3.5 text-[#6C5DD3]" />
                                        <span>Edit Leave</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => onCancel(parent)}
                                        className="cursor-pointer gap-2.5 whitespace-nowrap py-1 text-[13px] font-medium text-[#1E293B]"
                                      >
                                        <X className="size-3.5 text-[#6C5DD3]" />
                                        <span>Cancel Leave</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </TableCell>
                            )}
                          </>
                        )

                        return (
                          <Fragment key={parent.id}>
                            <TableRow
                              className={cn(
                                "min-h-[44px] border-border bg-white hover:bg-[#fafafa]",
                                parentRowBorder,
                              )}
                            >
                              <TableCell className="border-r border-border/70 px-0 py-1 text-center align-middle">
                                {hasChildren ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 shrink-0 text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                                    aria-expanded={expanded}
                                    aria-label={expanded ? "Hide multicode rows" : "Show multicode rows"}
                                    onClick={() => toggleExpanded(parent.id)}
                                  >
                                    {expanded ? (
                                      <ChevronDown className="size-4" aria-hidden />
                                    ) : (
                                      <ChevronRight className="size-4" aria-hidden />
                                    )}
                                  </Button>
                                ) : (
                                  <span className="inline-flex size-8 items-center justify-center" aria-hidden />
                                )}
                              </TableCell>
                              {renderDataCells(parent, false)}
                            </TableRow>
                            {expanded &&
                              hasChildren &&
                              children.map((child, ci) => {
                                const childBorder =
                                  isLastGroup && ci === children.length - 1 ? "border-b-0" : "border-b"
                                return (
                                  <TableRow
                                    key={child.id}
                                    className={cn(
                                      "min-h-[40px] border-border hover:bg-[#f3f0fc]/80",
                                      childBorder,
                                    )}
                                  >
                                    <TableCell className="border-r border-border/70 bg-[#f8f7fc]/90 py-1 text-center align-middle">
                                      <span
                                        className="inline-block w-4 border-l-2 border-[#6C5DD3]/35 pl-1"
                                        aria-hidden
                                      />
                                    </TableCell>
                                    {renderDataCells(child, true)}
                                  </TableRow>
                                )
                              })}
                          </Fragment>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-white px-6 py-4 sm:justify-end">
            <Button
              onClick={() => onOpenChange(false)}
              className="min-w-[120px] rounded-[6px] bg-[#6C5DD3] font-medium text-white hover:bg-[#5b4eb3]"
            >
              Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
