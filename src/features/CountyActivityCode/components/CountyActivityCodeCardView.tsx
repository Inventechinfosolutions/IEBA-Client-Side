import React from "react"
import { ChevronDown, ChevronRight, Check, X, Eye } from "lucide-react"
import editIconImg from "@/assets/edit-icon.png"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Spinner } from "@/components/ui/spinner"
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

function StatusIcon({ value }: { value: boolean | undefined | null }) {
  return (
    <img
      src={value ? statusCheckImg : statusCrossImg}
      alt={value ? "Yes" : "No"}
      className="h-4 w-4 object-contain"
    />
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
      <div className="p-4 bg-[#F6F5FF] dark:bg-[#13141a] border-t border-[#E5E7EB] dark:border-[#27272a] flex items-center justify-center">
        <Spinner className="size-5 text-[#6C5DD3]" />
      </div>
    )
  }

  if (children.length === 0) {
    return (
      <div className="p-4 bg-[#F6F5FF] dark:bg-[#13141a] border-t border-[#E5E7EB] dark:border-[#27272a] text-center text-[12px] text-gray-500">
        No sub-activities found
      </div>
    )
  }

  return (
    <div className="bg-[#F6F5FF] dark:bg-[#13141a] border-t border-[#E5E7EB] dark:border-[#27272a] p-3 space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#6C5DD3] dark:text-[#a78bfa] px-1">
        Sub-County Activity Codes ({children.length})
      </div>
      {children.map((child) => {
        const cleanChildDesc = stripHtmlTags(child.description || "")
        return (
          <div
            key={`sub-card-${child.id}`}
            className="rounded-[10px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] shadow-xs overflow-hidden"
          >
            {/* Header / Top row of Sub Activity */}
            <div className="bg-[#7C6BDD] px-3.5 py-2.5 text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold text-[13px] tracking-wide bg-white/20 px-2.5 py-0.5 rounded-[5px] text-white shrink-0">
                  {child.countyActivityCode || "—"}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                    child.active
                      ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30"
                      : "bg-rose-500/20 text-rose-100 border border-rose-400/30"
                  }`}
                >
                  {child.active ? (
                    <>
                      <Check className="size-3" /> Active
                    </>
                  ) : (
                    <>
                      <X className="size-3" /> Inactive
                    </>
                  )}
                </span>

                {canUpdateCountyActivity && (
                  child.apportioning === true && child.manualApportioning === true ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onEditRow(child)}
                            className="p-1 hover:bg-white/20 rounded-[4px] transition-colors text-white cursor-pointer"
                            title="Auto-created manual activity cannot be modified"
                          >
                            <Eye className="size-3.5" />
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
                      className="p-1 hover:bg-white/20 rounded-[4px] transition-colors cursor-pointer"
                      title="Edit Sub-Activity"
                    >
                      <img src={editIconImg} alt="Edit" className="size-3.5 object-contain brightness-200" />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Sub Activity Body / Fields */}
            <div className="p-3.5 space-y-3 text-[12px]">
              {/* Activity Name */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                  Activity Name
                </div>
                <div className="text-[13px] font-medium text-[#4B5563] dark:text-[#d4d4d8] leading-snug break-words">
                  {child.countyActivityName || "—"}
                </div>
              </div>

              {/* Description Field */}
              <div className="space-y-0.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                  Description
                </div>
                <div className="text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af] leading-relaxed whitespace-normal break-words">
                  {cleanChildDesc || "—"}
                </div>
              </div>

              {/* Attributes Grid for Sub-Activity */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-2.5 pt-2.5 border-t border-[#F3F4F6] dark:border-[#27272a]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                    Leave Code
                  </div>
                  <div className="mt-0.5">
                    <StatusIcon value={child.leaveCode} />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                    Multi Job Pools
                  </div>
                  <div className="mt-0.5">
                    <StatusIcon value={child.multipleJobPools} />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                    SPMP
                  </div>
                  <div className="mt-0.5">
                    <StatusIcon value={false} />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                    Match
                  </div>
                  <div className="mt-0.5">
                    <StatusIcon value={false} />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                    %
                  </div>
                  <div className="mt-0.5">
                    <StatusIcon value={false} />
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                    Apportioning
                  </div>
                  <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af]">
                    --
                  </div>
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
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`county-card-skeleton-${idx}`}
              className="rounded-[12px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
            >
              <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
                <div className="h-4 w-1/3 rounded bg-white/40" />
                <div className="h-5 w-16 rounded bg-white/40" />
              </div>
              <div className="p-5 space-y-4">
                <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="h-16 rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-16 rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-16 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No county activity codes found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {data.map((row) => {
            const rowIdStr = String(row.id)
            const isExpanded = Boolean(expandedParentIds[rowIdStr])
            const cleanDesc = stripHtmlTags(row.description || "")
            const masterCodeDisplay = row.catalogActivityCode || (row.masterCode > 0 ? String(row.masterCode) : "—")

            return (
              <div
                key={`county-card-${row.id}`}
                className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] shadow-sm hover:shadow-md transition-all overflow-hidden w-full min-w-0"
              >
                {/* Header */}
                <div className="bg-[#6C5DD3] px-4 py-3 text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="font-bold text-[14px] tracking-wide bg-white/20 px-2.5 py-1 rounded-[6px] text-white shrink-0">
                      {row.countyActivityCode || "—"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status Badge */}
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        row.active
                          ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30"
                          : "bg-rose-500/20 text-rose-100 border border-rose-400/30"
                      }`}
                    >
                      {row.active ? (
                        <>
                          <Check className="size-3" /> Active
                        </>
                      ) : (
                        <>
                          <X className="size-3" /> Inactive
                        </>
                      )}
                    </span>

                    {/* Expand Toggle */}
                    {row.hasChild ? (
                      <button
                        type="button"
                        onClick={() => onToggleExpand(rowIdStr)}
                        className="p-1 hover:bg-white/20 rounded-[6px] transition-colors text-white"
                        title={isExpanded ? "Collapse sub-activities" : "Expand sub-activities"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-5" />
                        ) : (
                          <ChevronRight className="size-5" />
                        )}
                      </button>
                    ) : null}

                    {/* Edit Button */}
                    {canUpdateCountyActivity ? (
                      row.apportioning === true && row.manualApportioning === true ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => onEdit(row)}
                                className="p-1 hover:bg-white/20 rounded-[6px] transition-colors text-white cursor-pointer"
                                title="Auto-created manual activity cannot be modified"
                              >
                                <Eye className="size-4" />
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
                          onClick={() => onEdit(row)}
                          className="p-1 hover:bg-white/20 rounded-[6px] transition-colors"
                          title="Edit County Activity Code"
                        >
                          <img src={editIconImg} alt="Edit" className="size-4 object-contain brightness-200" />
                        </button>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3.5 text-[13px]">
                  {/* Activity Name */}
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                      Activity Name
                    </div>
                    <div className="text-[13px] font-medium text-[#4B5563] dark:text-[#d4d4d8] leading-snug break-words">
                      {row.countyActivityName || "—"}
                    </div>
                  </div>

                  {/* Description Field */}
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                      Description
                    </div>
                    <div className="text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af] leading-relaxed whitespace-normal break-words">
                      {cleanDesc || "—"}
                    </div>
                  </div>

                  {/* Attributes & Indicators Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3.5 pt-3 border-t border-[#F3F4F6] dark:border-[#27272a]">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Department
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af] break-words">
                        {row.department || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Master Code Type
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af] truncate">
                        {row.masterCodeType || "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Master Code
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af] truncate">
                        {masterCodeDisplay}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Apportioning
                      </div>
                      <div className="mt-0.5 text-[12px] font-medium text-[#6C5DD3] dark:text-[#a78bfa] truncate">
                        {typeof row.apportioning === "string" ? (
                          row.apportioning
                        ) : (
                          <StatusIcon value={Boolean(row.apportioning)} />
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Leave Code
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af]">
                        <StatusIcon value={row.leaveCode} />
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        SPMP
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af]">
                        <StatusIcon value={row.spmp} />
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Match
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af]">
                        {row.match ? (
                          <span>{row.match}</span>
                        ) : (
                          <StatusIcon value={false} />
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        %
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af]">
                        {typeof row.percentage === "number" ? row.percentage.toFixed(2) : "0.00"}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#1F2937] dark:text-[#f4f4f5]">
                        Multi Job Pools
                      </div>
                      <div className="mt-0.5 text-[12px] font-normal text-[#6B7280] dark:text-[#9ca3af]">
                        <StatusIcon value={row.multipleJobPools} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Sub-Activities */}
                {row.hasChild && isExpanded && (
                  <CountyActivityCardSubRows
                    parentId={row.id}
                    canUpdateCountyActivity={canUpdateCountyActivity}
                    onEditRow={onEdit}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}

      {footer ? <div className="pt-2">{footer}</div> : null}
    </div>
  )
}
