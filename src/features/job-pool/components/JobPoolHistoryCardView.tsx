import React, { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { JobPoolHistoryDetailPanel } from "./JobPoolHistoryDetailPanel"
import {
  getJobPoolHistoryColumns,
  jobPoolHistoryRowHasDetail,
} from "../lib/jobPoolHistoryDisplay"
import type { JobPoolHistoryRecord } from "../queries/jobPoolHistory"

export interface JobPoolHistoryCardViewProps {
  data: JobPoolHistoryRecord[]
  isLoading: boolean
  assignmentKind?: string
}

export function JobPoolHistoryCardView({
  data,
  isLoading,
  assignmentKind = "",
}: JobPoolHistoryCardViewProps) {
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const columns = getJobPoolHistoryColumns(assignmentKind)

  const toggleRow = (rowKey: string) => {
    setExpandedRowIds((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))
  }

  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`history-card-skeleton-${idx}`}
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
            No history records found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((row, idx) => {
            const rowKey = String(row.id ?? idx)
            const isExpanded = Boolean(expandedRowIds[rowKey])
            const hasDetail = jobPoolHistoryRowHasDetail(row)
            
            const primaryColumn = columns[0]
            const primaryTitle = primaryColumn ? primaryColumn.getValue(row) : "History Detail"
            const eventColumn = columns.find((c) => c.isEvent)
            const eventValue = eventColumn ? eventColumn.getValue(row) : null

            // Other columns to display in body
            const bodyColumns = columns.filter(
              (c) => c.key !== primaryColumn?.key && c.key !== eventColumn?.key
            )

            return (
              <div
                key={`job-pool-hist-card-${rowKey}`}
                className="rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-3 text-white gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {hasDetail && (
                      <button
                        type="button"
                        onClick={() => toggleRow(rowKey)}
                        className="p-1 hover:bg-white/20 rounded-[6px] transition-colors text-white cursor-pointer shrink-0"
                        title={isExpanded ? "Collapse details" : "Expand details"}
                      >
                        {isExpanded ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </button>
                    )}
                    <span className="font-bold text-[14px] truncate text-white">
                      {primaryTitle}
                    </span>
                  </div>

                  {eventValue && (
                    <span className="shrink-0 inline-flex items-center rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium text-white border border-white/30">
                      {eventValue}
                    </span>
                  )}
                </div>

                {/* Card Body - 2 Column Alignment */}
                <div className="p-4 space-y-3.5 flex-1 bg-white dark:bg-[#0c0d12]">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {bodyColumns.map((col) => {
                      const val = col.getValue(row)
                      const isFullWidth =
                        col.key === "userName" ||
                        col.key === "activityName" ||
                        col.key === "jobClassificationName"

                      return (
                        <div
                          key={col.key}
                          className={isFullWidth ? "col-span-2" : "col-span-1"}
                        >
                          <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                            {col.header}
                          </span>
                          <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                            {val}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Expanded Detail Panel */}
                {isExpanded && hasDetail && (
                  <div className="border-t border-[#E5E7EB] dark:border-[rgba(108,93,211,0.3)] bg-[#FAFAFC] dark:bg-[#13141a]">
                    <JobPoolHistoryDetailPanel row={row} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
