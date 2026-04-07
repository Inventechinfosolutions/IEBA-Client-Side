import { useState } from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Check, ChevronDown, ChevronUp, MessageCircle, RotateCcw, X } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { LeaveApprovalStatus, leaveApprovalStatusLabel } from "../enums/leaveApprovalStatus"
import type { LeaveApprovalStatusValue } from "../enums/leaveApprovalStatus"
import type { LeaveApprovalSortKey, LeaveApprovalTableProps } from "../types"

const headers: { label: string; className?: string; sortKey?: LeaveApprovalSortKey }[] = [
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
}: LeaveApprovalTableProps) {
  const [isEmployeeTooltipOpen, setIsEmployeeTooltipOpen] = useState(false)
  const [isStartDateTooltipOpen, setIsStartDateTooltipOpen] = useState(false)

  const renderActionIcon = (status: LeaveApprovalStatusValue) => {
    // Requested: dual approve/reject buttons below (this icon not used for that row).
    if (status === LeaveApprovalStatus.REQUESTED) {
      return (
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-white">
          <RotateCcw className="size-4 text-[#f59e0b]" aria-hidden />
        </span>
      )
    }

    // Show the *action* available (swap approved/rejected icons).
    if (status === LeaveApprovalStatus.APPROVED) return rejectIcon
    if (status === LeaveApprovalStatus.REJECTED) return approveIcon

    // Withdraw: no action.
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
                  key={h.label + (h.className ?? "")}
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
                    <div className="flex h-full w-full items-center justify-center">{h.label}</div>
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
                  <TableCell key={`loading-${idx}-${h.label}`} className="border-r border-[#eff0f5] px-3">
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
            rows.map((row) => (
              <TableRow key={row.id} className="min-h-[44px] border-[#e9ecf3] hover:bg-[#FAFAFA]">
                <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] leading-[1.15rem] text-[#111827] whitespace-normal break-words">
                  {`${row.user?.firstName ?? ""} ${row.user?.lastName ?? ""}`.trim() || row.userId}
                </TableCell>
                <TableCell className="border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]">
                  {row.startdt}
                </TableCell>
                <TableCell className="border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]">
                  {row.starttime}
                </TableCell>
                <TableCell className="border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]">
                  {row.endtime}
                </TableCell>
                <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] leading-[1.15rem] text-[#111827] whitespace-normal break-words">
                  {`${row.programcode} ${row.programname}`.trim()}
                </TableCell>
                <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] text-[#111827]">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="mx-auto max-w-full cursor-default overflow-hidden text-ellipsis whitespace-nowrap">
                          {`${row.activitycode} ${row.activityname}`.trim()}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} collisionPadding={12} className="px-3 py-2">
                        <div className="max-w-[320px] whitespace-normal break-words">
                          {`${row.activitycode} ${row.activityname}`.trim()}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]">
                  {row.leaveTotalTime}
                </TableCell>
                <TableCell className="border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]">
                  {leaveApprovalStatusLabel[row.status]}
                </TableCell>
                <TableCell className="border-r border-[#eff0f5] px-3 text-center">
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
                          {row.requestcomment?.trim() ||
                            row.supervisorcomment?.trim() ||
                            "No comments"}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="px-3 text-center">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {row.status === LeaveApprovalStatus.WITHDRAW ? (
                          <span
                            className="inline-flex items-center justify-center"
                            aria-label="Withdraw"
                            data-leave-row-action="status"
                          >
                            {renderActionIcon(row.status)}
                          </span>
                        ) : row.status === LeaveApprovalStatus.REQUESTED ? (
                          <div className="inline-flex items-center justify-center gap-2">
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center justify-center hover:opacity-90"
                              aria-label="Approve"
                              data-leave-row-action="approve"
                              onClick={() => onOpenComments(row.id, "approve")}
                            >
                              {approveIcon}
                            </button>
                            <button
                              type="button"
                              className="inline-flex cursor-pointer items-center justify-center hover:opacity-90"
                              aria-label="Reject"
                              data-leave-row-action="reject"
                              onClick={() => onOpenComments(row.id, "reject")}
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
                                row.id,
                                row.status === LeaveApprovalStatus.APPROVED ? "reject" : "approve",
                              )
                            }}
                          >
                            {renderActionIcon(row.status)}
                          </button>
                        )}
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6} collisionPadding={12} className="px-3 py-2">
                        <div className="max-w-[220px] whitespace-normal break-words">
                          {actionTooltip(row.status)}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}


