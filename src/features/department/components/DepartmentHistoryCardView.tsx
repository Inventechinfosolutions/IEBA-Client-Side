import type { ReactNode } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { DepartmentHistoryRecord } from "../queries/departmentHistory"
import { DepartmentHistoryDetailPanel } from "./DepartmentHistoryDetailPanel"
import {
  getDepartmentHistoryCodeDisplay,
  getDepartmentHistoryEffectiveFromDisplay,
  getDepartmentHistoryEffectiveToDisplay,
  getDepartmentHistoryEventDisplay,
  getDepartmentHistoryNameDisplay,
  getDepartmentHistoryReportsDisplay,
  getDepartmentHistoryUpdatedAtDisplay,
  getDepartmentHistoryUpdatedByDisplay,
} from "../lib/departmentHistoryDisplay"

export type DepartmentHistoryCardViewProps = {
  historyData: DepartmentHistoryRecord[]
  isLoading?: boolean
  isScopedView?: boolean
  expandedRowIds: Record<string, boolean>
  onToggleRow: (rowKey: string) => void
  footer?: ReactNode
}

export function DepartmentHistoryCardView({
  historyData,
  isLoading,
  isScopedView = false,
  expandedRowIds,
  onToggleRow,
  footer,
}: DepartmentHistoryCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`history-card-skeleton-${idx}`}
              className="rounded-[12px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
            >
              <div className="h-11 bg-[#6C5DD3] px-4 py-3 flex justify-between items-center">
                <div className="h-4 w-1/3 rounded bg-white/40" />
                <div className="h-4 w-16 rounded bg-white/40" />
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : historyData.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">No department history found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {historyData.map((row, idx) => {
            const rowKey = String(row.id ?? idx)
            const isExpanded = Boolean(expandedRowIds[rowKey])
            const eventLabel = getDepartmentHistoryEventDisplay(row)
            const codeDisplay = getDepartmentHistoryCodeDisplay(row)
            const nameDisplay = getDepartmentHistoryNameDisplay(row)

            return (
              <div
                key={`history-card-${rowKey}`}
                className="history-card rounded-[12px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-3 text-white gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="font-bold text-[14px] truncate">
                      {!isScopedView && codeDisplay !== "—" ? `${codeDisplay} - ${nameDisplay}` : `Event: ${eventLabel}`}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                    {eventLabel}
                  </span>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3 flex-1 bg-white dark:bg-[#0c0d12]">
                  {/* Effective Dates Grid */}
                  <div className="grid grid-cols-2 gap-3 border-b border-gray-100 dark:border-zinc-800 pb-2.5">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Effective From:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px]">
                        {getDepartmentHistoryEffectiveFromDisplay(row)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Effective To:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px]">
                        {getDepartmentHistoryEffectiveToDisplay(row)}
                      </span>
                    </div>
                  </div>

                  {/* Reports & Audit User Info */}
                  <div className="space-y-2 border-b border-gray-100 dark:border-zinc-800 pb-2.5">
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Reports:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right truncate max-w-[60%]">
                        {getDepartmentHistoryReportsDisplay(row)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Updated By:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                        {getDepartmentHistoryUpdatedByDisplay(row)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[12px]">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Updated At:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                        {getDepartmentHistoryUpdatedAtDisplay(row)}
                      </span>
                    </div>
                  </div>

                  {/* Expand / Details Toggle Button */}
                  <button
                    type="button"
                    onClick={() => onToggleRow(rowKey)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#F5F3FF] dark:bg-zinc-900 text-[#6C5DD3] dark:text-[#a799ff] text-[12px] font-semibold hover:bg-[#ECE9FE] transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        Hide Details <ChevronDown className="size-3.5" />
                      </>
                    ) : (
                      <>
                        View Details <ChevronRight className="size-3.5" />
                      </>
                    )}
                  </button>

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="pt-2 border-t border-gray-100 dark:border-zinc-800">
                      <DepartmentHistoryDetailPanel row={row} />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {footer && <div className="mt-4">{footer}</div>}
    </div>
  )
}
