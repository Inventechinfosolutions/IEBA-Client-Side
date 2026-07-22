import React from "react"
import { ChevronDown, ChevronRight, Check, X, Eye } from "lucide-react"

import editIconImg from "@/assets/edit-icon.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useGetCountyActivityNested } from "../queries/getCountyActivityCodes"
import type { CountyActivityCodeRow } from "../types"

export interface CountyActivityCodeCardViewProps {
  data: CountyActivityCodeRow[]
  isLoading: boolean
  canUpdateCountyActivity: boolean
  onEdit: (row: CountyActivityCodeRow) => void
  expandedParentIds: Record<string, boolean>
  onToggleExpand: (rowId: string) => void
  footer?: React.ReactNode
}

function stripHtmlTags(html: string): string {
  if (!html) return ""
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s{2,}/g, " ")
    .trim()
}

function AttributeCheck({ value }: { value: boolean | undefined | null }) {
  return value ? (
    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
  ) : (
    <X className="size-3 text-rose-600 dark:text-rose-400" />
  )
}

function CountyActivityCardSubRows({
  parentId,
  canUpdateCountyActivity,
  onEditRow,
}: {
  parentId: string
  canUpdateCountyActivity: boolean
  onEditRow: (child: CountyActivityCodeRow) => void
}) {
  const query = useGetCountyActivityNested(Number(parentId), true)
  const children = query.data ?? []

  if (query.isLoading) {
    return (
      <div className="p-3 space-y-2 animate-pulse rounded-lg bg-purple-50/40 dark:bg-zinc-900/40">
        <Skeleton className="h-3.5 w-1/2 rounded" />
        <Skeleton className="h-3.5 w-3/4 rounded" />
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="p-3 text-center text-[12px] text-gray-500 dark:text-zinc-400">
        No sub-activities found
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {children.map((child, idx) => {
        const cleanChildDesc = stripHtmlTags(child.description || "")
        const childTitle = child.countyActivityCode
          ? `${child.countyActivityCode} - ${child.countyActivityName}`
          : child.countyActivityName

        return (
          <div
            key={`sub-card-${child.id}-${idx}`}
            className="rounded-[10px] border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-zinc-900/40 shadow-sm overflow-hidden text-[13px] flex flex-col"
          >
            {/* Child Header */}
            <div className="flex items-center justify-between bg-purple-700 dark:bg-purple-800 px-3 py-1.5 text-white gap-2">
              <span className="font-semibold text-[11px] sm:text-[12px] leading-tight whitespace-normal break-words flex-1 min-w-0">
                {childTitle}
              </span>
              {canUpdateCountyActivity && (
                child.apportioning === true && child.manualApportioning === true ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => onEditRow(child)}
                          className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors flex items-center justify-center"
                          aria-label="View Sub-Activity"
                        >
                          <Eye className="size-[14px]" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="center"
                        sideOffset={6}
                        className="z-50 rounded-[8px] border-0 bg-black px-3 py-2 text-left text-[12px] font-medium leading-relaxed text-white shadow-lg"
                      >
                        Auto-created manual activity cannot be modified
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <button
                    type="button"
                    onClick={() => onEditRow(child)}
                    className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors flex items-center justify-center"
                    aria-label="Edit Sub-Activity"
                  >
                    <img
                      src={editIconImg}
                      alt="Edit"
                      aria-hidden="true"
                      className="size-[14px] object-contain brightness-0 invert"
                    />
                  </button>
                )
              )}
            </div>

            {/* Child Body */}
            <div className="p-3 space-y-2 bg-white dark:bg-[#0c0d12]">
              {/* Row 1: Status */}
              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                  Status:
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                    child.active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {child.active ? (
                    <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <X className="size-2.5 text-rose-600 dark:text-rose-400" />
                  )}
                  {child.active ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Row 2: Department */}
              <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px] gap-2">
                <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                  Department:
                </span>
                <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                  {child.department || "—"}
                </span>
              </div>

              {/* Row 3: Description */}
              {cleanChildDesc ? (
                <div className="flex flex-col gap-0.5 pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                  <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                    Description:
                  </span>
                  <span className="font-medium text-[#111827] dark:text-[#e5e7eb] break-words">
                    {cleanChildDesc}
                  </span>
                </div>
              ) : null}

              {/* Row 4: Key Attributes */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                    Leave Code:
                  </span>
                  <AttributeCheck value={child.leaveCode} />
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                    Multi Job Pools:
                  </span>
                  <AttributeCheck value={child.multipleJobPools} />
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                    SPMP:
                  </span>
                  <AttributeCheck value={child.spmp} />
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                  <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                    Match %:
                  </span>
                  <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                    {typeof child.percentage === "number" ? child.percentage.toFixed(2) : "0.00"}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export function CountyActivityCodeCardView({
  data,
  isLoading,
  canUpdateCountyActivity,
  onEdit,
  expandedParentIds,
  onToggleExpand,
  footer,
}: CountyActivityCodeCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`county-card-skeleton-${idx}`}
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
      ) : data.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No county activity codes found"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No county activity codes found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((row, idx) => {
            const rowIdStr = String(row.id)
            const isExpanded = Boolean(expandedParentIds[rowIdStr])
            const cleanDesc = stripHtmlTags(row.description || "")
            const masterCodeDisplay = row.catalogActivityCode || (row.masterCode > 0 ? String(row.masterCode) : "—")
            const cardTitle = row.countyActivityCode
              ? `${row.countyActivityCode} - ${row.countyActivityName}`
              : row.countyActivityName

            return (
              <div
                key={`county-card-${row.id}-${idx}`}
                className="history-card rounded-[12px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Level 0 Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-3.5 py-1.5 text-white gap-2">
                  <span
                    onClick={() => row.hasChild && onToggleExpand(rowIdStr)}
                    className={`font-semibold text-[12px] sm:text-[13px] leading-tight whitespace-normal break-words flex-1 min-w-0 ${
                      row.hasChild ? "cursor-pointer" : ""
                    }`}
                  >
                    {cardTitle}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {/* Expand Toggle */}
                    {row.hasChild && (
                      <button
                        type="button"
                        onClick={() => onToggleExpand(rowIdStr)}
                        className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors flex items-center justify-center"
                        title={isExpanded ? "Collapse sub-activities" : "Expand sub-activities"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-5" />
                        ) : (
                          <ChevronRight className="size-5" />
                        )}
                      </button>
                    )}

                    {/* Edit Button */}
                    {canUpdateCountyActivity && (
                      row.apportioning === true && row.manualApportioning === true ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onEdit(row)}
                                className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors flex items-center justify-center"
                                aria-label="View Activity"
                              >
                                <Eye className="size-[14px]" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="center"
                              sideOffset={6}
                              className="z-50 rounded-[8px] border-0 bg-black px-3 py-2 text-left text-[12px] font-medium leading-relaxed text-white shadow-lg"
                            >
                              Auto-created manual activity cannot be modified
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit(row)
                          }}
                          className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors flex items-center justify-center"
                          aria-label="Edit Activity"
                        >
                          <img
                            src={editIconImg}
                            alt="Edit"
                            aria-hidden="true"
                            className="size-[14px] object-contain brightness-0 invert"
                          />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Level 0 Card Body */}
                <div className="p-4 space-y-2.5 bg-white dark:bg-[#0c0d12]">
                  {/* Row 1: Status */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        row.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {row.active ? (
                        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="size-3 text-rose-600 dark:text-rose-400" />
                      )}
                      {row.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Row 2: Department */}
                  <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-zinc-800 gap-2">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                      Department:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px] text-right break-words max-w-[70%]">
                      {row.department || "—"}
                    </span>
                  </div>

                  {/* Row 3: Description */}
                  {cleanDesc ? (
                    <div className="flex flex-col gap-0.5 pb-2 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Description:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px] break-words">
                        {cleanDesc}
                      </span>
                    </div>
                  ) : null}

                  {/* Row 4: Master Code Type */}
                  {row.masterCodeType ? (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Master Code Type:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px]">
                        {row.masterCodeType}
                      </span>
                    </div>
                  ) : null}

                  {/* Row 5: Master Code */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Master Code:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px]">
                      {masterCodeDisplay}
                    </span>
                  </div>

                  {/* Row 6: Attributes Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                        Leave Code:
                      </span>
                      <AttributeCheck value={row.leaveCode} />
                    </div>
                    <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                        Apportioning:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                        {typeof row.apportioning === "string" ? (
                          row.apportioning
                        ) : (
                          <AttributeCheck value={Boolean(row.apportioning)} />
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                        SPMP:
                      </span>
                      <AttributeCheck value={row.spmp} />
                    </div>
                    <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                        Match %:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                        {typeof row.percentage === "number" ? row.percentage.toFixed(2) : "0.00"}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-1 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                        Multi Job Pools:
                      </span>
                      <AttributeCheck value={row.multipleJobPools} />
                    </div>
                  </div>

                  {/* NESTED CHILDREN (Rendered INSIDE parent card body) */}
                  {row.hasChild && isExpanded && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-purple-100 dark:border-purple-900/40 pl-1 sm:pl-2">
                      <CountyActivityCardSubRows
                        parentId={row.id}
                        canUpdateCountyActivity={canUpdateCountyActivity}
                        onEditRow={onEdit}
                      />
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
