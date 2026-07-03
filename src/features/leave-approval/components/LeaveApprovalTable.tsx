import { Fragment, useMemo, useState } from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, ChevronRight, ChevronUp, MessageCircle, RotateCcw, X } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { LeaveApprovalStatus, leaveApprovalStatusLabel } from "../enums/leaveApprovalStatus"
import type { LeaveApprovalStatusValue } from "../enums/leaveApprovalStatus"
import type { LeaveApprovalRow, LeaveApprovalSortKey, LeaveApprovalTableProps } from "../types"
import {
  assignSyntheticParentIdsByTimeSlot,
  groupUserLeaveRows,
  type UserLeaveMultiCodeFragment,
} from "@/lib/groupUserLeaveRows"
import { cn } from "@/lib/utils"

function syntheticListChild(
  parent: LeaveApprovalRow,
  mc: UserLeaveMultiCodeFragment,
  index: number,
): LeaveApprovalRow {
  const id = mc.id ?? -(Math.abs(parent.id) * 10_000 + index + 1)
  return {
    ...parent,
    id,
    parentId: parent.id,
    programid: mc.programid != null ? String(mc.programid) : parent.programid,
    activityid: mc.activityid != null ? String(mc.activityid) : parent.activityid,
    programcode: mc.programcode ?? parent.programcode,
    programname: mc.programname ?? parent.programname,
    activitycode: mc.activitycode ?? parent.activitycode,
    activityname: mc.activityname ?? parent.activityname,
    leaveTotalTime: mc.leaveTotalTime ?? parent.leaveTotalTime,
    requestcomment: mc.requestcomment ?? null,
    supervisorcomment: mc.supervisorcomment ?? null,
  }
}

const headers: { label: string; className?: string; sortKey?: LeaveApprovalSortKey }[] = [
  { label: "", className: "w-[40px]" },
  { label: "Emp. Name", className: "w-[130px]", sortKey: "employeeName" },
  { label: "Start Date", className: "w-[110px]", sortKey: "startDate" },
  { label: "Time of Day", className: "w-[110px]" },
  { label: "Time of Day", className: "w-[110px]" },
  { label: "Program Code", className: "w-[230px]" },
  { label: "Activity Code", className: "w-[260px]" },
  { label: "Total Min.", className: "w-[90px]" },
  { label: "Status", className: "w-[110px]" },
  { label: "Comments", className: "w-[70px]" },
  { label: "Action", className: "w-[80px]" },
]

export function LeaveApprovalTable({
  rows,
  isLoading,
  sort,
  onToggleSort,
  onOpenComments,
  dropdownData,
}: LeaveApprovalTableProps) {
  const getProgramLabel = (leave: LeaveApprovalRow) => {
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

  const [isEmployeeTooltipOpen, setIsEmployeeTooltipOpen] = useState(false)
  const [isStartDateTooltipOpen, setIsStartDateTooltipOpen] = useState(false)
  const [expandedByParentId, setExpandedByParentId] = useState<Record<number, boolean>>({})

  const preparedRows = useMemo(() => assignSyntheticParentIdsByTimeSlot(rows), [rows])
  const groupedRows = useMemo(
    () => groupUserLeaveRows(preparedRows, { synthesizeChild: syntheticListChild }),
    [preparedRows],
  )

  const toggleExpanded = (parentId: number) => {
    setExpandedByParentId((prev) => ({ ...prev, [parentId]: !prev[parentId] }))
  }

  const renderActionIcon = (status: LeaveApprovalStatusValue) => {
    if (status === LeaveApprovalStatus.REQUESTED) {
      return (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-white">
          <RotateCcw className="size-4 text-[#f59e0b]" aria-hidden />
        </span>
      )
    }

    if (status === LeaveApprovalStatus.APPROVED) return rejectIcon
    if (status === LeaveApprovalStatus.REJECTED) return approveIcon

    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-white">
        <RotateCcw className="size-4 text-[#f59e0b]" aria-hidden />
      </span>
    )
  }

  const actionTooltip = (status: LeaveApprovalStatusValue) => {
    if (status === LeaveApprovalStatus.APPROVED) return "Reject"
    if (status === LeaveApprovalStatus.REJECTED) return "Approve"
    if (status === LeaveApprovalStatus.REQUESTED) return "Approve / Reject"
    return leaveApprovalStatusLabel[status]
  }

  const approveIcon = (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#22c55e]">
      <Check className="size-2.5 text-white" aria-hidden />
    </span>
  )

  const rejectIcon = (
    <span className="inline-flex size-4 items-center justify-center rounded-full bg-[#ef4444]/80">
      <X className="size-2.5 text-white" aria-hidden />
    </span>
  )

  const sortHint = (key: LeaveApprovalSortKey) => {
    const state = sort?.key === key ? sort.direction : "none"
    if (state === "none") return "Sort"
    if (state === "asc") return "Sorted asc"
    return "Sorted desc"
  }

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#e6e7ef]">
      <Table className="table-fixed">
        <TableHeader className="[&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent">
            {headers.map((h, index) => {
              const isSortable = Boolean(h.sortKey)
              const key = h.sortKey
              const dividerClass =
                index === headers.length - 1 ? "border-r-0" : "border-r border-white/50"
              return (
                <TableHead
                  key={`${h.label}-${h.sortKey ?? index}`}
                  className={`h-10 bg-[var(--primary)] p-[10px] text-center text-[12px] font-medium text-white ${dividerClass} ${h.className ?? ""}`}
                >
                  {isSortable && key ? (
                    <TooltipProvider>
                      <Tooltip
                        open={
                          key === "employeeName"
                            ? isEmployeeTooltipOpen
                            : isStartDateTooltipOpen
                        }
                      >
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onToggleSort(key)}
                            onMouseEnter={() => {
                              if (key === "employeeName") setIsEmployeeTooltipOpen(true)
                              else setIsStartDateTooltipOpen(true)
                            }}
                            onMouseLeave={() => {
                              if (key === "employeeName") setIsEmployeeTooltipOpen(false)
                              else setIsStartDateTooltipOpen(false)
                            }}
                            onFocus={() => {
                              if (key === "employeeName") setIsEmployeeTooltipOpen(true)
                              else setIsStartDateTooltipOpen(true)
                            }}
                            onBlur={() => {
                              if (key === "employeeName") setIsEmployeeTooltipOpen(false)
                              else setIsStartDateTooltipOpen(false)
                            }}
                            aria-label={`${h.label} ${sortHint(key)}`}
                            className="inline-flex h-full w-full cursor-pointer items-center justify-between gap-1.5 pr-1 text-white"
                          >
                            <span>{h.label}</span>
                            <span className="inline-flex flex-col items-center leading-none">
                              <ChevronUp
                                className={`size-[10px] ${
                                  sort?.key === key && sort.direction === "asc"
                                    ? "text-white"
                                    : "text-white/50"
                                }`}
                              />
                              <ChevronDown
                                className={`-mt-1 size-[10px] ${
                                  sort?.key === key && sort.direction === "desc"
                                    ? "text-white"
                                    : "text-white/50"
                                }`}
                              />
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} collisionPadding={12} className="px-3 py-2">
                          {sort?.key !== key
                            ? "Click to sort ascending"
                            : sort.direction === "asc"
                              ? "Click to sort descending"
                              : "Click to cancel sorting"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      {h.label ? h.label : <span className="sr-only">Expand</span>}
                    </div>
                  )}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, idx) => (
              <TableRow key={`leave-approval-loading-${idx}`} className="h-11 border-[#e9ecf3] hover:bg-transparent">
                {headers.map((h) => (
                  <TableCell key={`loading-${idx}-${h.label}-${h.sortKey ?? ""}`} className="border-r border-[#eff0f5] px-3">
                    <Skeleton className="h-4 w-full rounded-[4px] bg-[#f0f2f8]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : rows.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={headers.length} className="h-[180px] p-0">
                <div className="h-full">
                  <div className="flex h-[146px] items-center justify-center">
                    <img
                      src={tableEmptyIcon}
                      alt="No data"
                      className="h-24 w-32 object-contain"
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            groupedRows.map(({ parent: row, children }) => {
              const expanded = !!expandedByParentId[row.id]
              const hasChildren = children.length > 0

              const renderDataCells = (r: LeaveApprovalRow, isChild: boolean) => (
                <>
                  <TableCell
                    className={cn(
                      "align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] leading-[1.15rem] text-[#111827] whitespace-normal break-words",
                      isChild && "bg-[#f8f7fc]/90",
                    )}
                  >
                    {isChild ? (
                      <>
                        <span className="sr-only">Same employee as parent row</span>
                        <span
                          className="inline-block min-h-[1rem] border-l-2 border-[#6C5DD3]/35 pl-2"
                          aria-hidden
                        />
                      </>
                    ) : (
                      <span>
                        {r.user?.name?.trim() || `${r.user?.lastName ?? ""} ${r.user?.firstName ?? ""}`.trim() || r.userId}
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]",
                      isChild && "bg-[#f8f7fc]/90",
                    )}
                  >
                    {isChild ? (
                      <span className="sr-only">Same start date as parent row</span>
                    ) : (
                      r.startdt
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]",
                      isChild && "bg-[#f8f7fc]/90",
                    )}
                  >
                    {isChild ? (
                      <span className="sr-only">Same start time as parent row</span>
                    ) : (
                      r.starttime
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]",
                      isChild && "bg-[#f8f7fc]/90",
                    )}
                  >
                    {isChild ? (
                      <span className="sr-only">Same end time as parent row</span>
                    ) : (
                      r.endtime
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] leading-[1.15rem] text-[#111827] whitespace-normal break-words",
                      isChild && "bg-[#f8f7fc]/90",
                    )}
                  >
                    {getProgramLabel(r)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] text-[#111827]",
                      isChild && "bg-[#f8f7fc]/90",
                    )}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="mx-auto max-w-full cursor-default overflow-hidden text-ellipsis whitespace-nowrap">
                            {r.activitycode} - {r.activityname}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} collisionPadding={12} className="px-3 py-2">
                          <div className="max-w-[320px] whitespace-normal break-words">
                            {r.activitycode} - {r.activityname}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]",
                      isChild && "bg-[#f8f7fc]/90",
                    )}
                  >
                    {r.leaveTotalTime}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]",
                      isChild && "bg-[#f8f7fc]/90",
                    )}
                  >
                    {leaveApprovalStatusLabel[r.status]}
                  </TableCell>
                  <TableCell
                    className={cn("border-r border-[#eff0f5] px-3 text-center", isChild && "bg-[#f8f7fc]/90")}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex items-center justify-center"
                            aria-label="Comments"
                            data-leave-row-action="comments"
                          >
                            <span className="relative inline-flex size-5 items-center justify-center">
                              <MessageCircle className="size-5 text-[#6c5dd3]" aria-hidden />
                              <span className="pointer-events-none absolute inset-0 flex items-center justify-center gap-[2px]">
                                <span className="size-[2.5px] rounded-full bg-[#6c5dd3]" />
                                <span className="size-[2.5px] rounded-full bg-[#6c5dd3]" />
                                <span className="size-[2.5px] rounded-full bg-[#6c5dd3]" />
                              </span>
                            </span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6} collisionPadding={12} className="px-3 py-2">
                          <div className="max-w-[320px] whitespace-normal break-words">
                            {r.requestcomment?.trim() ||
                              r.supervisorcomment?.trim() ||
                              "No comments"}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className={cn("px-3 text-center", isChild && "bg-[#f8f7fc]/90")}>
                    {isChild ? (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {r.status === LeaveApprovalStatus.WITHDRAW ? (
                              <span
                                className="inline-flex items-center justify-center"
                                aria-label="Withdraw"
                                data-leave-row-action="status"
                              >
                                {renderActionIcon(r.status)}
                              </span>
                            ) : r.status === LeaveApprovalStatus.REQUESTED ? (
                              <div className="inline-flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  className="inline-flex cursor-pointer items-center justify-center hover:opacity-90"
                                  aria-label="Approve"
                                  data-leave-row-action="approve"
                                  onClick={() => onOpenComments(r.id, "approve")}
                                >
                                  {approveIcon}
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex cursor-pointer items-center justify-center hover:opacity-90"
                                  aria-label="Reject"
                                  data-leave-row-action="reject"
                                  onClick={() => onOpenComments(r.id, "reject")}
                                >
                                  {rejectIcon}
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="inline-flex cursor-pointer items-center justify-center hover:opacity-90"
                                aria-label="Action"
                                data-leave-row-action="status"
                                onClick={() => {
                                  onOpenComments(
                                    r.id,
                                    r.status === LeaveApprovalStatus.APPROVED ? "reject" : "approve",
                                  )
                                }}
                              >
                                {renderActionIcon(r.status)}
                              </button>
                            )}
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} collisionPadding={12} className="px-3 py-2">
                            <div className="max-w-[220px] whitespace-normal break-words">
                              {actionTooltip(r.status)}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </TableCell>
                </>
              )

              return (
                <Fragment key={row.id}>
                  <TableRow className="min-h-[44px] border-[#e9ecf3] hover:bg-[#fafafa]">
                    <TableCell className="border-r border-[#eff0f5] px-1 text-center align-middle">
                      {hasChildren ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-[#6C5DD3] hover:bg-[#6C5DD3]/10"
                          aria-expanded={expanded}
                          aria-label={expanded ? "Hide multicode rows" : "Show multicode rows"}
                          onClick={() => toggleExpanded(row.id)}
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
                    {renderDataCells(row, false)}
                  </TableRow>
                  {expanded &&
                    hasChildren &&
                    children.map((child) => (
                      <TableRow
                        key={child.id}
                        className="min-h-[40px] border-[#e9ecf3] hover:bg-[#f3f0fc]/80"
                      >
                        <TableCell className="border-r border-[#eff0f5] bg-[#f8f7fc]/90 px-1 text-center align-middle">
                          <span className="inline-flex size-8 items-center justify-center" aria-hidden />
                        </TableCell>
                        {renderDataCells(child, true)}
                      </TableRow>
                    ))}
                </Fragment>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
