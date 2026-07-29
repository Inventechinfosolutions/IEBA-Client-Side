import type { ReactNode } from "react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { UserProgramHistoryRecord } from "../queries/userProgramHistory"
import {
  getProgramHistoryCreatedAtDisplay,
  getProgramHistoryCreatedByDisplay,
  getProgramHistoryEffectiveFromDisplay,
  getProgramHistoryEffectiveToDisplay,
  getProgramHistoryEventDisplay,
  getProgramHistoryUpdatedAtDisplay,
  getProgramHistoryUpdatedByDisplay,
} from "../lib/userProgramHistoryDisplay"

export type UserProgramHistoryCardViewProps = {
  historyData: UserProgramHistoryRecord[]
  isLoading?: boolean
  isUserAssignmentHistory?: boolean
  footer?: ReactNode
}

export function UserProgramHistoryCardView({
  historyData,
  isLoading,
  isUserAssignmentHistory = false,
  footer,
}: UserProgramHistoryCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`user-program-card-skeleton-${idx}`}
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
            alt="No history found"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No history found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {historyData.map((row, idx) => {
            const rowKey = String(row.id ?? idx)

            return (
              <div
                key={`user-program-card-${rowKey}`}
                className="history-card rounded-[12px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-2.5 text-white gap-2">
                  <span className="font-semibold text-[11px] sm:text-[12px] leading-snug whitespace-normal break-words flex-1 min-w-0">
                    {row.programCode
                      ? `${row.programCode} - ${row.programName ?? ""}`
                      : (row.programName ?? "Program")}
                  </span>
                  {!isUserAssignmentHistory && (
                    <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">
                      {getProgramHistoryEventDisplay(row)}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="p-4 space-y-2.5 bg-white dark:bg-[#0c0d12]">
                  {isUserAssignmentHistory ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                          Effective From:
                        </span>
                        <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px]">
                          {getProgramHistoryEffectiveFromDisplay(row)}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                          Effective To:
                        </span>
                        <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px]">
                          {getProgramHistoryEffectiveToDisplay(row)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                          Created By:
                        </span>
                        <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                          {getProgramHistoryCreatedByDisplay(row)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                          Created At:
                        </span>
                        <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                          {getProgramHistoryCreatedAtDisplay(row)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                          Updated By:
                        </span>
                        <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                          {getProgramHistoryUpdatedByDisplay(row)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[12px]">
                        <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                          Updated At:
                        </span>
                        <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                          {getProgramHistoryUpdatedAtDisplay(row)}
                        </span>
                      </div>
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
