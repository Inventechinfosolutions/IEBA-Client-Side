import React from "react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { CostPoolHistoryRecord } from "../queries/costPoolHistory"

export interface CostPoolHistoryCardViewProps {
  data: CostPoolHistoryRecord[]
  isLoading: boolean
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  try {
    const parts = dateStr.split("-")
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const d = parseInt(parts[2], 10)
      return new Date(y, m, d).toLocaleDateString()
    }
    return new Date(dateStr).toLocaleDateString()
  } catch {
    return dateStr
  }
}

export function CostPoolHistoryCardView({
  data,
  isLoading,
}: CostPoolHistoryCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`cost-pool-history-card-skeleton-${idx}`}
              className="rounded-[10px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-5 space-y-3 animate-pulse"
            >
              <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="h-4 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-10 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-10 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[150px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No history found"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[13px] text-gray-500 dark:text-zinc-400">
            No cost pool history found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((row, idx) => {
            const activityCodeHeader = row.activityCode || row.activityName || `Record #${idx + 1}`

            return (
              <div
                key={`cost-pool-hist-card-${row.id ?? idx}`}
                className="rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Header - Only Activity Code */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-3 text-white gap-2">
                  <span className="font-bold text-[14px] truncate text-white">
                    {activityCodeHeader}
                  </span>
                </div>

                {/* Body - Activity Name inside card + 2-Column fields */}
                <div className="p-4 space-y-3.5 flex-1 bg-white dark:bg-[#0c0d12]">
                  {/* Activity Name - Full width */}
                  <div className="border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2.5">
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-1">
                      Activity Name
                    </span>
                    <span className="font-semibold text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                      {row.activityName || "—"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div>
                      <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                        Assignment Kind
                      </span>
                      <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                        {row.assignmentKind || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                        User Name
                      </span>
                      <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                        {row.userName || row.userId || "—"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                        Effective From
                      </span>
                      <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                        {formatDate(row.effectiveFrom)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                        Effective To
                      </span>
                      <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                        {formatDate(row.effectiveTo)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
