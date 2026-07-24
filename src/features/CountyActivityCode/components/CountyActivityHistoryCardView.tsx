import React from "react"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { ActivityHistoryRecord } from "../queries/activityHistory"
import {
  getActivityHistoryCreatedAtDisplay,
  getActivityHistoryCreatedByDisplay,
  getActivityHistoryEffectiveFromDisplay,
  getActivityHistoryEffectiveToDisplay,
  getActivityHistoryEventDisplay,
  getActivityHistoryUpdatedAtDisplay,
  getActivityHistoryUpdatedByDisplay,
} from "../lib/activityHistoryDisplay"

export interface CountyActivityHistoryCardViewProps {
  historyData: ActivityHistoryRecord[]
  isLoading: boolean
  isAssignmentLayout?: boolean
  footer?: React.ReactNode
}

export function CountyActivityHistoryCardView({
  historyData,
  isLoading,
  isAssignmentLayout = false,
  footer,
}: CountyActivityHistoryCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`county-history-skeleton-${idx}`}
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
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No history found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {historyData.map((row, idx) => {
            const codeDisplay = row.activityCode ?? "—"
            const nameDisplay = row.activityName ?? "—"
            const eventLabel = getActivityHistoryEventDisplay(row)

            return (
              <div
                key={`county-history-card-${row.id ?? idx}`}
                className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] shadow-sm hover:shadow-md transition-all overflow-hidden w-full min-w-0"
              >
                {/* Header */}
                <div className="bg-[#6C5DD3] px-4 py-3 text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-[14px] bg-white/20 px-2.5 py-0.5 rounded-[4px]">
                      {codeDisplay}
                    </span>
                    <span className="text-[13px] font-medium text-white/90 truncate">
                      {nameDisplay}
                    </span>
                  </div>
                  {!isAssignmentLayout && eventLabel ? (
                    <span className="text-[11px] font-semibold bg-white/20 text-white px-2.5 py-1 rounded-[6px] shrink-0 uppercase tracking-wider">
                      {eventLabel}
                    </span>
                  ) : null}
                </div>

                {/* Body Details */}
                <div className="p-4 space-y-3 text-[13px]">
                  {isAssignmentLayout ? (
                    <div className="grid grid-cols-2 gap-3 rounded-[8px] bg-[#FAFAFC] dark:bg-[#14151a] p-3 border border-[#E5E7EB] dark:border-[#27272a]">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                          Effective From
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-[#111827] dark:text-white">
                          {getActivityHistoryEffectiveFromDisplay(row)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                          Effective To
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-[#111827] dark:text-white">
                          {getActivityHistoryEffectiveToDisplay(row)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-[8px] bg-[#FAFAFC] dark:bg-[#14151a] p-3 border border-[#E5E7EB] dark:border-[#27272a]">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                          Created By
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-[#111827] dark:text-white leading-tight">
                          {getActivityHistoryCreatedByDisplay(row)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                          Created At
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-[#111827] dark:text-white leading-tight">
                          {getActivityHistoryCreatedAtDisplay(row)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                          Updated By
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-[#111827] dark:text-white leading-tight">
                          {getActivityHistoryUpdatedByDisplay(row)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                          Updated At
                        </div>
                        <div className="mt-1 text-[12px] font-medium text-[#111827] dark:text-white leading-tight">
                          {getActivityHistoryUpdatedAtDisplay(row)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {footer ? <div className="pt-2">{footer}</div> : null}
    </div>
  )
}
