import React, { useState } from "react"
import { Check, ChevronDown, ChevronRight, MessageCircle, RotateCcw, X } from "lucide-react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { LeaveApprovalStatus, leaveApprovalStatusLabel } from "../enums/leaveApprovalStatus"
import type { LeaveApprovalStatusValue } from "../enums/leaveApprovalStatus"
import type { LeaveApprovalRow, LeaveApprovalTableProps } from "../types"
import { groupUserLeaveRows, type UserLeaveMultiCodeFragment } from "@/lib/groupUserLeaveRows"

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

export function LeaveApprovalCardView({
  rows,
  isLoading,
  onOpenComments,
  dropdownData,
}: Omit<LeaveApprovalTableProps, "sort" | "onToggleSort">) {
  const [expandedByParentId, setExpandedByParentId] = useState<Record<number, boolean>>({})

  const groupedRows = React.useMemo(
    () => groupUserLeaveRows(rows, { synthesizeChild: syntheticListChild }),
    [rows],
  )

  const toggleExpanded = (parentId: number) => {
    setExpandedByParentId((prev) => ({ ...prev, [parentId]: !prev[parentId] }))
  }

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

  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`leave-card-skeleton-${idx}`}
              className="rounded-[12px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
            >
              <div className="h-11 bg-[#6C5DD3] px-4 py-3 flex justify-between items-center">
                <div className="h-4 w-1/3 rounded bg-white/40" />
                <div className="h-4 w-16 rounded bg-white/40" />
              </div>
              <div className="p-4 space-y-3">
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-3 w-2/3 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No leave approvals found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {groupedRows.map(({ parent: row, children }) => {
            const expanded = !!expandedByParentId[row.id]
            const hasChildren = children.length > 0
            const empName =
              row.user?.name?.trim() ||
              `${row.user?.lastName ?? ""} ${row.user?.firstName ?? ""}`.trim() ||
              row.userId
            const cardTitle = `${empName} • ${row.startdt}`

            return (
              <div
                key={`leave-card-${row.id}`}
                className="history-card rounded-[12px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-3.5 py-1.5 text-white gap-2">
                  <span
                    onClick={() => hasChildren && toggleExpanded(row.id)}
                    className={`font-semibold text-[12px] sm:text-[13px] leading-tight whitespace-normal break-words flex-1 min-w-0 ${
                      hasChildren ? "cursor-pointer" : ""
                    }`}
                  >
                    {cardTitle}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Multicode Expand Toggle */}
                    {hasChildren && (
                      <button
                        type="button"
                        onClick={() => toggleExpanded(row.id)}
                        className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-white/15 hover:bg-white/25 p-1 transition-colors flex items-center justify-center"
                        title={expanded ? "Collapse multicodes" : "Expand multicodes"}
                      >
                        {expanded ? (
                          <ChevronDown className="size-4.5" />
                        ) : (
                          <ChevronRight className="size-4.5" />
                        )}
                      </button>
                    )}

                    {/* Action Icon Button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {row.status === LeaveApprovalStatus.WITHDRAW ? (
                            <span
                              className="inline-flex size-7 items-center justify-center rounded-[6px] bg-white/15"
                              aria-label="Withdraw"
                            >
                              {renderActionIcon(row.status)}
                            </span>
                          ) : row.status === LeaveApprovalStatus.REQUESTED ? (
                            <div className="inline-flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-emerald-600 hover:bg-emerald-700 p-1 transition-colors flex items-center justify-center"
                                aria-label="Approve"
                                onClick={() => onOpenComments(row.id, "approve")}
                              >
                                {approveIcon}
                              </button>
                              <button
                                type="button"
                                className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-rose-600 hover:bg-rose-700 p-1 transition-colors flex items-center justify-center"
                                aria-label="Reject"
                                onClick={() => onOpenComments(row.id, "reject")}
                              >
                                {rejectIcon}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-white/15 hover:bg-white/25 p-1 transition-colors flex items-center justify-center"
                              aria-label="Action"
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
                        <TooltipContent side="top" sideOffset={6} className="px-3 py-2">
                          {actionTooltip(row.status)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2.5 bg-white dark:bg-[#0c0d12]">
                  {/* Row 1: Status */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        row.status === LeaveApprovalStatus.APPROVED
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-400! dark:border-emerald-600/60"
                          : row.status === LeaveApprovalStatus.REJECTED
                          ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/90 dark:text-rose-400! dark:border-rose-600/60"
                          : row.status === LeaveApprovalStatus.WITHDRAW
                          ? "bg-gray-50 text-gray-700 border border-gray-200 dark:bg-zinc-800 dark:text-zinc-300! dark:border-zinc-700"
                          : "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/90 dark:text-amber-400! dark:border-amber-600/60"
                      }`}
                    >
                      {leaveApprovalStatusLabel[row.status]}
                    </span>
                  </div>

                  {/* Row 2: Time of Day */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Time of Day:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                      {row.starttime} - {row.endtime}
                    </span>
                  </div>

                  {/* Row 3: Program */}
                  <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-zinc-800 gap-2 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                      Program Code:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                      {getProgramLabel(row)}
                    </span>
                  </div>

                  {/* Row 4: Activity */}
                  <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-zinc-800 gap-2 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                      Activity Code:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                      {row.activitycode} - {row.activityname}
                    </span>
                  </div>

                  {/* Row 5: Total Min & Comments */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Total Min:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                      {row.leaveTotalTime} Min
                    </span>
                  </div>

                  {/* Row 6: Comments (Right-aligned Inline Display) */}
                  <div className="flex justify-between items-start gap-2 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                      Comments:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px] text-right break-words max-w-[70%]">
                      {row.requestcomment?.trim() || row.supervisorcomment?.trim() || "No comments"}
                    </span>
                  </div>

                  {/* Expanded Multicode Child Entries */}
                  {hasChildren && expanded && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-purple-100 dark:border-purple-900/40">
                      <div className="font-bold uppercase text-[10px] tracking-wider text-[#6C5DD3] dark:text-[#a78bfa] mb-1">
                        Multicode Breakdown
                      </div>
                      {children.map((child, childIdx) => (
                        <div
                          key={`child-${child.id}-${childIdx}`}
                          className="rounded-[8px] border border-purple-100 dark:border-purple-900/40 bg-[#f8f7fc] dark:bg-[#181825] p-3 space-y-1.5 text-[11px]"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 font-bold uppercase text-[9px]">
                              Program:
                            </span>
                            <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                              {getProgramLabel(child)}
                            </span>
                          </div>
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-gray-500 font-bold uppercase text-[9px]">
                              Activity:
                            </span>
                            <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                              {child.activitycode} - {child.activityname}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 font-bold uppercase text-[9px]">
                              Total Min:
                            </span>
                            <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                              {child.leaveTotalTime} Min
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
