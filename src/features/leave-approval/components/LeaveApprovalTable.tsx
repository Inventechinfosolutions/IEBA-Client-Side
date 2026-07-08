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
  { label: "", className: "w-[36px] min-w-[36px]" },
  { label: "Emp. Name", className: "w-[120px] min-w-[100px]", sortKey: "employeeName" },
  { label: "Start Date", className: "w-[100px] min-w-[90px]", sortKey: "startDate" },
  { label: "Start Time", className: "w-[90px] min-w-[80px]" },
  { label: "End Time", className: "w-[90px] min-w-[80px]" },
  { label: "Program Code", className: "w-[200px] min-w-[160px]" },
  { label: "Activity Code", className: "w-[220px] min-w-[180px]" },
  { label: "Total Min.", className: "w-[80px] min-w-[70px]" },
  { label: "Status", className: "w-[100px] min-w-[90px]" },
  { label: "Comments", className: "w-[70px] min-w-[60px]" },
  { label: "Action", className: "w-[80px] min-w-[70px]" },
]

// ─── Status badge colours ────────────────────────────────────────────────────
const statusBadgeClass: Record<LeaveApprovalStatusValue, string> = {
  draft:     "bg-gray-100 text-gray-600",
  requested: "bg-amber-50 text-amber-700 border border-amber-300",
  approved:  "bg-green-50 text-green-700 border border-green-300",
  rejected:  "bg-red-50 text-red-600 border border-red-300",
  withdraw:  "bg-slate-100 text-slate-500 border border-slate-300",
}

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

  const sortHint = (key: LeaveApprovalSortKey) => {
    const state = sort?.key === key ? sort.direction : "none"
    if (state === "none") return "Sort"
    if (state === "asc") return "Sorted asc"
    return "Sorted desc"
  }

  // ─── Shared action buttons renderer (used in both card + table) ────────────
  const renderActionButtons = (r: LeaveApprovalRow, isChild: boolean) => {
    if (isChild) return <span className="text-[11px] text-muted-foreground">—</span>

    if (r.status === LeaveApprovalStatus.WITHDRAW) {
      return (
        <span className="inline-flex items-center justify-center" aria-label="Withdraw">
          {renderActionIcon(r.status)}
        </span>
      )
    }

    if (r.status === LeaveApprovalStatus.REQUESTED) {
      return (
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
      )
    }

    return (
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
    )
  }

  // ─── CARD VIEW (mobile + tablet, hidden on lg+) ───────────────────────────
  const renderCard = (r: LeaveApprovalRow, isChild: boolean, parentRow?: LeaveApprovalRow) => {
    const employeeName = r.user?.name?.trim() || `${r.user?.lastName ?? ""} ${r.user?.firstName ?? ""}`.trim() || r.userId
    const comment = r.requestcomment?.trim() || r.supervisorcomment?.trim() || "No comments"

    return (
      <div
        key={r.id}
        className={cn(
          "relative rounded-[10px] border shadow-sm transition-shadow hover:shadow-md overflow-hidden",
          isChild
            ? "ml-4 border-l-4 border-l-[#6C5DD3]/40 border-[#eff0f5] bg-[#f8f7fc]/80"
            : "border-[#e6e7ef] bg-white",
        )}
      >
        {/* ── Card header bar — same colour as table header ── */}
        <div className="flex items-center justify-between gap-2 bg-[#6C5DD3] px-4 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar initial */}
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[12px] font-bold text-white">
              {isChild
                ? (parentRow
                    ? (parentRow.user?.name?.trim() || `${parentRow.user?.firstName ?? ""}`)
                        .charAt(0)
                        .toUpperCase()
                    : "·")
                : employeeName.charAt(0).toUpperCase()}
            </span>
            {/* "Emp. Name" label + value — matches table column */}
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70 leading-none mb-0.5">
                Emp. Name
              </p>
              <p className="text-[12px] font-semibold text-white truncate leading-tight">
                {isChild ? (
                  <span className="italic text-white/80">↳ Multi-code entry</span>
                ) : (
                  employeeName
                )}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              statusBadgeClass[r.status],
            )}
          >
            {leaveApprovalStatusLabel[r.status]}
          </span>
        </div>

        {/* ── Card body: field rows matching exact table column names ── */}
        <div className="divide-y divide-[#f0f0f6] px-4">

          {/* Start Date */}
          <div className="flex items-center gap-3 py-2">
            <span className="w-[100px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6C5DD3]">
              Start Date
            </span>
            <span className="text-[12px] text-[#374151]">{r.startdt || "—"}</span>
          </div>

          {/* Start Time */}
          <div className="flex items-center gap-3 py-2">
            <span className="w-[100px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6C5DD3]">
              Start Time
            </span>
            <span className="text-[12px] text-[#374151]">{r.starttime || "—"}</span>
          </div>

          {/* End Time */}
          <div className="flex items-center gap-3 py-2">
            <span className="w-[100px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6C5DD3]">
              End Time
            </span>
            <span className="text-[12px] text-[#374151]">{r.endtime || "—"}</span>
          </div>

          {/* Program Code */}
          <div className="flex items-start gap-3 py-2">
            <span className="w-[100px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6C5DD3] mt-0.5">
              Program Code
            </span>
            <span className="text-[12px] text-[#374151] break-words leading-snug">{getProgramLabel(r)}</span>
          </div>

          {/* Activity Code */}
          <div className="flex items-start gap-3 py-2">
            <span className="w-[100px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6C5DD3] mt-0.5">
              Activity Code
            </span>
            <span className="text-[12px] text-[#374151] break-words leading-snug">
              {r.activitycode} - {r.activityname}
            </span>
          </div>

          {/* Total Min. */}
          <div className="flex items-center gap-3 py-2">
            <span className="w-[100px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6C5DD3]">
              Total Min.
            </span>
            <span className="text-[12px] text-[#374151]">{r.leaveTotalTime}</span>
          </div>

          {/* Comments — icon only with tooltip (same as table) */}
          <div className="flex items-center gap-3 py-2">
            <span className="w-[100px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6C5DD3]">
              Comments
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex cursor-pointer items-center justify-center"
                    aria-label="Comments"
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
                  <div className="max-w-[280px] whitespace-normal break-words text-[12px]">{comment}</div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Action — approve/reject buttons only (no comments icon here) */}
          <div className="flex items-center gap-3 py-2.5">
            <span className="w-[100px] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-[#6C5DD3]">
              Action
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{renderActionButtons(r, isChild)}</span>
                </TooltipTrigger>
                {!isChild && (
                  <TooltipContent side="top" sideOffset={6} collisionPadding={12} className="px-3 py-2">
                    <div className="max-w-[200px] whitespace-normal break-words text-[12px]">
                      {actionTooltip(r.status)}
                    </div>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    )
  }

  // ─── TABLE cell renderer (desktop only) ───────────────────────────────────
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
        {isChild ? <span className="sr-only">Same start date as parent row</span> : r.startdt}
      </TableCell>
      <TableCell
        className={cn(
          "border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]",
          isChild && "bg-[#f8f7fc]/90",
        )}
      >
        {isChild ? <span className="sr-only">Same start time as parent row</span> : r.starttime}
      </TableCell>
      <TableCell
        className={cn(
          "border-r border-[#eff0f5] px-3 text-center text-[12px] text-[#111827]",
          isChild && "bg-[#f8f7fc]/90",
        )}
      >
        {isChild ? <span className="sr-only">Same end time as parent row</span> : r.endtime}
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
                {r.requestcomment?.trim() || r.supervisorcomment?.trim() || "No comments"}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className={cn("px-3 text-center", isChild && "bg-[#f8f7fc]/90")}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{renderActionButtons(r, isChild)}</span>
            </TooltipTrigger>
            {!isChild && (
              <TooltipContent side="top" sideOffset={6} collisionPadding={12} className="px-3 py-2">
                <div className="max-w-[220px] whitespace-normal break-words">
                  {actionTooltip(r.status)}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </TableCell>
    </>
  )

  // ─── LOADING SKELETONS ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <>
        {/* Card skeletons (mobile/tablet) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:hidden gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[10px] border border-[#e6e7ef] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-8 rounded-full bg-[#f0f2f8]" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-28 rounded bg-[#f0f2f8]" />
                    <Skeleton className="h-3 w-20 rounded bg-[#f0f2f8]" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full bg-[#f0f2f8]" />
              </div>
              <Skeleton className="mb-3 h-12 w-full rounded-[8px] bg-[#f0f2f8]" />
              <Skeleton className="mb-2 h-4 w-full rounded bg-[#f0f2f8]" />
              <Skeleton className="h-4 w-3/4 rounded bg-[#f0f2f8]" />
            </div>
          ))}
        </div>

        {/* Table skeletons (desktop) */}
        <div className="hidden xl:block overflow-hidden rounded-[4px] border border-[#e6e7ef]">
          <div className="w-full overflow-x-auto">
            <Table className="table-fixed min-w-[1100px]">
              <TableHeader className="[&_tr]:border-b-0">
                <TableRow className="hover:bg-transparent">
                  {headers.map((h, i) => (
                    <TableHead
                      key={i}
                      className={`h-10 bg-[var(--primary)] p-[10px] text-center text-[12px] font-medium text-white ${h.className ?? ""}`}
                    >
                      {h.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <TableRow key={idx} className="h-11 border-[#e9ecf3] hover:bg-transparent">
                    {headers.map((h) => (
                      <TableCell key={h.label} className="border-r border-[#eff0f5] px-3">
                        <Skeleton className="h-4 w-full rounded-[4px] bg-[#f0f2f8]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </>
    )
  }

  // ─── EMPTY STATE ───────────────────────────────────────────────────────────
  if (rows.length === 0) {
    return (
      <div className="flex h-[180px] items-center justify-center rounded-[4px] border border-[#e6e7ef]">
        <img src={tableEmptyIcon} alt="No data" className="h-24 w-32 object-contain" />
      </div>
    )
  }

  // ─── MAIN RENDER ───────────────────────────────────────────────────────────
  return (
    <>
      {/* ── CARD VIEW: mobile + tablet (hidden on xl+) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:hidden gap-4">
        {groupedRows.map(({ parent: row, children }) => {
          const expanded = !!expandedByParentId[row.id]
          const hasChildren = children.length > 0

          return (
            <div key={row.id} className="space-y-3">
              {/* Parent card */}
              <div className="relative">
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(row.id)}
                    aria-expanded={expanded}
                    aria-label={expanded ? "Hide multicode rows" : "Show multicode rows"}
                    className="absolute right-3 top-3 z-10 inline-flex size-7 items-center justify-center rounded-full bg-[#6C5DD3]/10 text-[#6C5DD3] hover:bg-[#6C5DD3]/20 transition-colors"
                  >
                    {expanded ? (
                      <ChevronDown className="size-4" aria-hidden />
                    ) : (
                      <ChevronRight className="size-4" aria-hidden />
                    )}
                  </button>
                )}
                {renderCard(row, false)}
              </div>

              {/* Child cards (multi-code) */}
              {expanded && hasChildren && (
                <div className="space-y-2 pl-2">
                  {children.map((child) => renderCard(child, true, row))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── TABLE VIEW: desktop xl+ ── */}
      <div className="hidden xl:block w-full overflow-hidden rounded-[4px] border border-[#e6e7ef]">
        <div className="w-full overflow-x-auto">
          <Table className="table-fixed min-w-[1100px]">
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
              {groupedRows.map(({ parent: row, children }) => {
                const expanded = !!expandedByParentId[row.id]
                const hasChildren = children.length > 0

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
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  )
}
