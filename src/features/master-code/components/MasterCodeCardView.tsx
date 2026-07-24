import React, { useState } from "react"
import DOMPurify from "dompurify"
import { ChevronDown, ChevronRight, Check, X } from "lucide-react"

import editIconImg from "@/assets/edit-icon.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import type { MasterCodeRow } from "../types"

export interface MasterCodeCardViewProps {
  codeType: string
  rows: MasterCodeRow[]
  isLoading: boolean
  canEdit?: boolean
  onEditRow: (row: MasterCodeRow) => void
  footer?: React.ReactNode
}

function AttributeCheck({ value }: { value: boolean | undefined | null }) {
  return value ? (
    <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
  ) : (
    <X className="size-3 text-rose-600 dark:text-rose-400" />
  )
}

export function MasterCodeCardView({
  codeType,
  rows,
  isLoading,
  canEdit,
  onEditRow,
  footer,
}: MasterCodeCardViewProps) {
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})

  const toggleExpand = (rowId: string) => {
    setExpandedRowIds((prev) => ({
      ...prev,
      [rowId]: !prev[rowId],
    }))
  }

  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`master-card-skeleton-${idx}`}
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
      ) : rows.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No master codes found"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No {codeType} codes found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((row, idx) => {
            const isExpanded = Boolean(expandedRowIds[row.id])
            const hasDesc = Boolean(row.activityDescription && row.activityDescription.trim())
            const cardTitle = row.code ? `${row.code} - ${row.name}` : row.name

            const sanitizedActivityDescription = hasDesc
              ? DOMPurify.sanitize(row.activityDescription ?? "", {
                  ALLOWED_TAGS: ["ul", "ol", "li", "b", "strong", "i", "em", "br", "p"],
                })
              : ""

            return (
              <div
                key={`master-card-${row.id}-${idx}`}
                className="history-card rounded-[12px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-3.5 py-1.5 text-white gap-2">
                  <span
                    onClick={() => hasDesc && toggleExpand(row.id)}
                    className={`font-semibold text-[12px] sm:text-[13px] leading-tight whitespace-normal break-words flex-1 min-w-0 ${
                      hasDesc ? "cursor-pointer" : ""
                    }`}
                  >
                    {cardTitle}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Expand Toggle */}
                    {hasDesc && (
                      <button
                        type="button"
                        onClick={() => toggleExpand(row.id)}
                        className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-white/15 hover:bg-white/25 p-1 transition-colors flex items-center justify-center"
                        title={isExpanded ? "Collapse description" : "Expand description"}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4.5" />
                        ) : (
                          <ChevronRight className="size-4.5" />
                        )}
                      </button>
                    )}

                    {/* Edit Button */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditRow(row)
                        }}
                        className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-white/15 hover:bg-white/25 p-1 transition-colors flex items-center justify-center"
                        aria-label="Edit Master Code"
                      >
                        <img
                          src={editIconImg}
                          alt="Edit"
                          aria-hidden="true"
                          className="size-[14px] object-contain brightness-0 invert"
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2.5 bg-white dark:bg-[#0c0d12]">
                  {/* Row 1: Status */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        row.status
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/90 dark:text-emerald-400! dark:border-emerald-600/60"
                          : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/90 dark:text-rose-400! dark:border-rose-600/60"
                      }`}
                    >
                      {row.status ? (
                        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="size-3 text-rose-600 dark:text-rose-400" />
                      )}
                      {row.status ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Row 2: SPMP */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      SPMP:
                    </span>
                    <AttributeCheck value={row.spmp} />
                  </div>

                  {/* Row 3: Allocable */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Allocable:
                    </span>
                    <AttributeCheck value={row.allocable} />
                  </div>

                  {/* Row 4: Percent (%) */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      {codeType} (%):
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                      {row.ffpPercent}
                    </span>
                  </div>

                  {/* Row 5: Match */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Match:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                      {row.match || "—"}
                    </span>
                  </div>

                  {/* Expanded Activity Description */}
                  {hasDesc && isExpanded && (
                    <div className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-900/40 text-[12px]">
                      <div className="font-bold uppercase text-[10px] tracking-wider text-[#6C5DD3] dark:text-[#a78bfa] mb-1">
                        Activity Description
                      </div>
                      <div
                        className="whitespace-normal break-words text-[12px] leading-5 text-[#4b5563] dark:text-[#d4d4d8] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
                        dangerouslySetInnerHTML={{
                          __html: sanitizedActivityDescription,
                        }}
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
