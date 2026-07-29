import { ChevronDown, ChevronRight, Edit2, MoreVertical, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import emptyIcon from "@/assets/icons/table-empty.png"
import { cn } from "@/lib/utils"
import type { UserLeaveDaySnapshotResDto } from "../types"

type PendingLeaveRequestCardViewProps = {
  leaves: UserLeaveDaySnapshotResDto[]
  groupedLeaves: { parent: UserLeaveDaySnapshotResDto; children: UserLeaveDaySnapshotResDto[] }[]
  expandedByParentId: Record<number, boolean>
  toggleExpanded: (parentId: number) => void
  onEdit: (leave: UserLeaveDaySnapshotResDto) => void
  onCancel: (leave: UserLeaveDaySnapshotResDto) => void
  getProgramLabel: (leave: UserLeaveDaySnapshotResDto) => string
  getActivityLabel: (leave: UserLeaveDaySnapshotResDto) => string
  isRejected: boolean
  isLoading?: boolean
}

export function PendingLeaveRequestCardView({
  leaves,
  groupedLeaves,
  expandedByParentId,
  toggleExpanded,
  onEdit,
  onCancel,
  getProgramLabel,
  getActivityLabel,
  isRejected,
  isLoading = false,
}: PendingLeaveRequestCardViewProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Spinner className="size-8 text-[#6C5DD3]" />
      </div>
    )
  }

  if (leaves.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 text-muted-foreground">
        <img src={emptyIcon} alt="No data" className="size-20 opacity-90" />
        <span className="text-sm">No leave requests found</span>
      </div>
    )
  }

  return (
    <div className="space-y-3.5 max-h-[65vh] overflow-y-auto pr-1">
      {groupedLeaves.map(({ parent, children }) => {
        const expanded = !!expandedByParentId[parent.id]
        const hasChildren = children.length > 0
        const hasTime = !!(parent.starttime || parent.endtime)

        return (
          <div
            key={parent.id}
            className="rounded-[12px] border border-[#6C5DD3]/25 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden"
          >
            {/* ── Top Purple Header Bar ── */}
            <div className="bg-[#6C5DD3] text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">
                  {parent.startdt}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggleExpanded(parent.id)}
                    className="size-7 flex items-center justify-center rounded-[6px] bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                    title={expanded ? "Hide multicode breakdown" : "Show multicode breakdown"}
                  >
                    <ChevronRight
                      className={cn("size-4 transition-transform duration-200", expanded && "rotate-90")}
                    />
                  </button>
                )}

                {!isRejected && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="size-7 flex items-center justify-center rounded-[6px] bg-white/20 hover:bg-white/30 text-white transition-colors cursor-pointer"
                      >
                        <MoreVertical className="size-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-[135px] bg-white dark:bg-zinc-900 p-1.5 z-70">
                      <DropdownMenuItem
                        onClick={() => onEdit(parent)}
                        className="cursor-pointer gap-2.5 py-1.5 text-[13px] font-medium text-[#1E293B] dark:text-zinc-200"
                      >
                        <Edit2 className="size-3.5 text-[#6C5DD3]" />
                        <span>Edit Leave</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onCancel(parent)}
                        className="cursor-pointer gap-2.5 whitespace-nowrap py-1.5 text-[13px] font-medium text-[#1E293B] dark:text-zinc-200"
                      >
                        <X className="size-3.5 text-[#6C5DD3]" />
                        <span>Cancel Leave</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>

            {/* ── Card Body ── */}
            <div className="p-3.5 space-y-3 bg-white dark:bg-zinc-900">
              {/* Status Row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  STATUS:
                </span>
                <span
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-[8px] border capitalize shrink-0",
                    parent.status?.toLowerCase() === "approved"
                      ? "border-[#22c55e] text-[#22c55e] bg-emerald-50/50 dark:bg-emerald-950/30"
                      : parent.status?.toLowerCase() === "rejected"
                      ? "border-[#ef4444] text-[#ef4444] bg-red-50/50 dark:bg-red-950/30"
                      : "border-[#f59e0b] text-[#f59e0b] bg-amber-50/50 dark:bg-amber-950/30"
                  )}
                >
                  {parent.status}
                </span>
              </div>

              <div className="border-b border-gray-100 dark:border-zinc-800/60" />

              {/* Program Code (Next Row) */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  PROGRAM CODE:
                </span>
                <p className="text-xs font-bold text-foreground break-words">
                  {getProgramLabel(parent)}
                </p>
              </div>

              <div className="border-b border-gray-100 dark:border-zinc-800/60" />

              {/* Activity Code */}
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  ACTIVITY CODE:
                </span>
                <p className="text-xs font-medium text-foreground/90 break-words">
                  {getActivityLabel(parent)}
                </p>
              </div>

              <div className="border-b border-gray-100 dark:border-zinc-800/60" />

              {/* Start Time, End Time & Total Min (Combined Row) */}
              {hasTime ? (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      START TIME:
                    </span>
                    <p className="text-xs font-medium text-foreground">
                      {parent.starttime?.slice(0, 5) || "—"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      END TIME:
                    </span>
                    <p className="text-xs font-medium text-foreground">
                      {parent.endtime?.slice(0, 5) || "—"}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      TOTAL MIN:
                    </span>
                    <p className="text-sm font-bold text-[#6C5DD3]">
                      {parent.leaveTotalTime} min
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    TOTAL MIN:
                  </span>
                  <p className="text-sm font-bold text-[#6C5DD3]">
                    {parent.leaveTotalTime} min
                  </p>
                </div>
              )}

              {/* Comments & Supervisor Feedback Boxes */}
              {(parent.requestcomment || parent.supervisorcomment) && (
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800/60">
                  {parent.requestcomment && (
                    <div className="rounded-[10px] border border-[#6C5DD3]/25 bg-[#FAF8FF] dark:bg-purple-950/20 p-3 space-y-1">
                      <span className="text-[10px] font-bold text-[#6C5DD3] dark:text-purple-400 uppercase tracking-wider block">
                        REQUEST COMMENT:
                      </span>
                      <p className="text-xs font-normal text-foreground dark:text-zinc-200 break-words">
                        {parent.requestcomment}
                      </p>
                    </div>
                  )}
                  {parent.supervisorcomment && (
                    <div className="rounded-[10px] border border-[#F59E0B]/40 bg-[#FFFDF5] dark:bg-amber-950/20 p-3 space-y-1">
                      <span className="text-[10px] font-bold text-[#D97706] dark:text-amber-500 uppercase tracking-wider block">
                        SUPERVISOR FEEDBACK:
                      </span>
                      <p className="text-xs font-normal text-foreground dark:text-zinc-200 break-words">
                        {parent.supervisorcomment}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── Multicode Child Breakdown ── */}
              {expanded && hasChildren && (
                <div className="space-y-2.5 pt-2.5 border-t border-gray-100 dark:border-zinc-800/60">
                  <span className="text-[10px] font-bold text-[#6C5DD3] uppercase tracking-wider">
                    MULTICODE BREAKDOWN:
                  </span>
                  <div className="space-y-3">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="rounded-[12px] border border-[#6C5DD3]/30 dark:border-[#6C5DD3]/40 bg-[#FAF8FF] dark:bg-zinc-950 overflow-hidden shadow-xs"
                      >
                        {/* Child Header: Vibrant Purple bar */}
                        <div className="bg-[#6C5DD3] text-white px-3.5 py-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[220px]">
                            {getProgramLabel(child)}
                          </span>
                          <span className="bg-white/20 px-2.5 py-0.5 rounded-[6px] text-xs font-bold text-white shrink-0">
                            {child.leaveTotalTime} min
                          </span>
                        </div>
                        {/* Child Body */}
                        <div className="p-3.5 bg-[#FAF8FF] dark:bg-zinc-950 space-y-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-[#8A92A6] uppercase tracking-wider">
                              ACTIVITY:
                            </span>
                            <p className="text-xs font-bold text-[#1E293B] dark:text-zinc-100">
                              {getActivityLabel(child)}
                            </p>
                          </div>
                          {(child.requestcomment || child.supervisorcomment) && (
                            <div className="space-y-2 pt-1.5 border-t border-gray-100 dark:border-zinc-800/60">
                              {child.requestcomment && (
                                <div className="rounded-[8px] border border-[#6C5DD3]/25 bg-white dark:bg-zinc-900 p-2.5 space-y-0.5">
                                  <span className="text-[10px] font-bold text-[#6C5DD3] dark:text-purple-400 uppercase tracking-wider block">
                                    REQUEST COMMENT:
                                  </span>
                                  <p className="text-xs font-normal text-foreground dark:text-zinc-200 break-words">
                                    {child.requestcomment}
                                  </p>
                                </div>
                              )}
                              {child.supervisorcomment && (
                                <div className="rounded-[8px] border border-[#F59E0B]/40 bg-[#FFFDF5] dark:bg-amber-950/20 p-2.5 space-y-0.5">
                                  <span className="text-[10px] font-bold text-[#D97706] dark:text-amber-500 uppercase tracking-wider block">
                                    SUPERVISOR FEEDBACK:
                                  </span>
                                  <p className="text-xs font-normal text-foreground dark:text-zinc-200 break-words">
                                    {child.supervisorcomment}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
