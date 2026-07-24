import type { ReactNode } from "react"
import { Check, ChevronDown, ChevronRight, EllipsisVertical, Eye, Pencil, Plus, X } from "lucide-react"

import editIconImg from "@/assets/edit-icon.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { ProgramRow } from "../types"

export type TimeStudyProgramCardViewProps = {
  sortedPrograms: ProgramRow[]
  childrenByParentId: Record<string, ProgramRow[]>
  childrenLoading: Record<string, boolean>
  expandedPrograms: Record<string, boolean>
  isLoading?: boolean
  readonly?: boolean
  canAddTsProgram?: boolean
  canUpdateTsProgram?: boolean
  onEditRow: (row: ProgramRow) => void
  onAddSubProgramFromParent?: (row: ProgramRow) => void
  toggleExpand: (row: ProgramRow) => void
  footer?: ReactNode
}

export function TimeStudyProgramCardView({
  sortedPrograms,
  childrenByParentId,
  childrenLoading,
  expandedPrograms,
  isLoading,
  readonly = false,
  canAddTsProgram = false,
  canUpdateTsProgram = false,
  onEditRow,
  onAddSubProgramFromParent,
  toggleExpand,
  footer,
}: TimeStudyProgramCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`ts-card-skeleton-${idx}`}
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
      ) : sortedPrograms.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No programs found"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No time study programs found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedPrograms.map((level0Row, level0Idx) => {
            const level0Id = level0Row.id
            const isLevel0Expanded = Boolean(expandedPrograms[level0Id])
            const level1Children = childrenByParentId[level0Id] || []
            const isLevel0Loading = Boolean(childrenLoading[level0Id])

            return (
              <div
                key={`ts-card-primary-${level0Id}-${level0Idx}`}
                className="history-card rounded-[12px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Level 0 Card Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-3.5 py-1.5 text-white gap-2">
                  <span className="font-semibold text-[12px] sm:text-[13px] leading-tight whitespace-normal break-words flex-1 min-w-0">
                    {level0Row.code ? `${level0Row.code} - ${level0Row.name}` : level0Row.name}
                  </span>
                  {!readonly && canUpdateTsProgram && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditRow(level0Row)
                      }}
                      className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors flex items-center justify-center"
                      aria-label={level0Row.apportioning === true && level0Row.manualApportioning === true ? "View Program" : "Edit Program"}
                    >
                      {level0Row.apportioning === true && level0Row.manualApportioning === true ? (
                        <Eye className="size-[14px] text-white" />
                      ) : (
                        <img
                          src={editIconImg}
                          alt="Edit"
                          aria-hidden="true"
                          className="size-[14px] object-contain brightness-0 invert"
                        />
                      )}
                    </button>
                  )}
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
                        level0Row.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {level0Row.active ? (
                        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="size-3 text-rose-600 dark:text-rose-400" />
                      )}
                      {level0Row.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Row 2: Department */}
                  <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-zinc-800 gap-2">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                      Department:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px] text-right break-words max-w-[70%]">
                      {level0Row.department || "—"}
                    </span>
                  </div>

                  {/* Row 3: Medical % */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Medical %:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px]">
                      {level0Row.medicalPct ?? "0.00"}%
                    </span>
                  </div>

                  {/* Row 4: Description */}
                  {level0Row.description ? (
                    <div className="flex flex-col gap-0.5 pb-2 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Description:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px] break-words">
                        {level0Row.description}
                      </span>
                    </div>
                  ) : null}

                  {/* Toggle Button for Level 1 Secondary Programs */}
                  <button
                    type="button"
                    onClick={() => toggleExpand(level0Row)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#F5F3FF] dark:bg-zinc-900 text-[#6C5DD3] dark:text-[#a799ff] text-[12px] font-semibold hover:bg-[#ECE9FE] transition-colors cursor-pointer"
                  >
                    {isLevel0Expanded ? (
                      <>
                        Hide TS Sub Program One <ChevronDown className="size-3.5" />
                      </>
                    ) : (
                      <>
                        View TS Sub Program One <ChevronRight className="size-3.5" />
                      </>
                    )}
                  </button>

                  {/* Loading State for Level 1 */}
                  {isLevel0Loading && (
                    <div className="p-3 space-y-2 animate-pulse rounded-lg bg-purple-50/40 dark:bg-zinc-900/40">
                      <Skeleton className="h-3 w-1/2 rounded" />
                      <Skeleton className="h-3 w-3/4 rounded" />
                    </div>
                  )}

                  {/* NESTED CHILDREN (Rendered INSIDE parent card body) */}
                  {isLevel0Expanded && level1Children.length > 0 && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-purple-100 dark:border-purple-900/40 pl-1 sm:pl-2">
                      {level1Children.map((level1Row, level1Idx) => {
                        const level1Id = level1Row.id
                        const isLevel1Expanded = Boolean(expandedPrograms[level1Id])
                        const level2Children = childrenByParentId[level1Id] || []
                        const isLevel1Loading = Boolean(childrenLoading[level1Id])

                        return (
                          <div
                            key={`ts-card-secondary-${level1Id}-${level1Idx}`}
                            className="rounded-[10px] border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-zinc-900/40 shadow-sm overflow-hidden text-[13px] flex flex-col"
                          >
                            {/* Level 1 Header */}
                            <div className="flex items-center justify-between bg-purple-700 dark:bg-purple-800 px-3 py-1.5 text-white gap-2">
                              <span className="font-semibold text-[11px] sm:text-[12px] leading-tight whitespace-normal break-words flex-1 min-w-0">
                                {level1Row.code ? `${level1Row.code} - ${level1Row.name}` : level1Row.name}
                              </span>
                              {!readonly && (canAddTsProgram || canUpdateTsProgram) && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(e) => e.stopPropagation()}
                                      className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors flex items-center justify-center"
                                      aria-label="Actions"
                                    >
                                      <EllipsisVertical className="size-[14px]" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    side="bottom"
                                    sideOffset={4}
                                    className="w-[92px] rounded-[6px] border border-[#edf0f6] p-1 shadow-md bg-white dark:bg-[#18181b]"
                                  >
                                    {canAddTsProgram && level1Row.active && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onAddSubProgramFromParent?.(level1Row)
                                        }}
                                        className="cursor-pointer gap-1.5 rounded px-2 py-1 text-[12px] text-[#111827] dark:text-white"
                                      >
                                        <Plus className="size-3.5 text-[#6C5DD3]" />
                                        Add
                                      </DropdownMenuItem>
                                    )}
                                    {canUpdateTsProgram && (
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onEditRow(level1Row)
                                        }}
                                        className="cursor-pointer gap-1.5 rounded px-2 py-1 text-[12px] text-[#111827] dark:text-white"
                                      >
                                        {level1Row.apportioning === true && level1Row.manualApportioning === true ? (
                                          <>
                                            <Eye className="size-3.5 text-[#6C5DD3]" />
                                            View
                                          </>
                                        ) : (
                                          <>
                                            <Pencil className="size-3.5 text-[#6C5DD3]" />
                                            Edit
                                          </>
                                        )}
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            {/* Level 1 Body */}
                            <div className="p-3 space-y-2 bg-white dark:bg-[#0c0d12]">
                              {/* Row 1: Status */}
                              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                                <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                                  Status:
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                    level1Row.active
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                  }`}
                                >
                                  {level1Row.active ? (
                                    <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <X className="size-2.5 text-rose-600 dark:text-rose-400" />
                                  )}
                                  {level1Row.active ? "Active" : "Inactive"}
                                </span>
                              </div>

                              {/* Row 2: Department */}
                              <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px] gap-2">
                                <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                                  Department:
                                </span>
                                <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                                  {level1Row.department || "—"}
                                </span>
                              </div>

                              {/* Row 3: Medical % */}
                              <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                                <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                                  Medical %:
                                </span>
                                <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                                  {level1Row.medicalPct ?? "0.00"}%
                                </span>
                              </div>

                              {/* Row 4: Description */}
                              {level1Row.description ? (
                                <div className="flex flex-col gap-0.5 pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                                  <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                                    Description:
                                  </span>
                                  <span className="font-medium text-[#111827] dark:text-[#e5e7eb] break-words">
                                    {level1Row.description}
                                  </span>
                                </div>
                              ) : null}

                              {/* Toggle Level 2 Sub-Programs */}
                              <button
                                type="button"
                                onClick={() => toggleExpand(level1Row)}
                                className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-50 dark:bg-zinc-900 text-[#6C5DD3] dark:text-[#a799ff] text-[11px] font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                              >
                                {isLevel1Expanded ? (
                                  <>
                                    Hide TS Sub Program Two <ChevronDown className="size-3.5" />
                                  </>
                                ) : (
                                  <>
                                    View TS Sub Program Two <ChevronRight className="size-3.5" />
                                  </>
                                )}
                              </button>

                              {/* Loading State for Level 2 */}
                              {isLevel1Loading && (
                                <div className="p-2 space-y-2 animate-pulse">
                                  <Skeleton className="h-3 w-1/2 rounded" />
                                  <Skeleton className="h-3 w-3/4 rounded" />
                                </div>
                              )}

                              {/* Level 2 Sub-Programs (Nested inside Level 1 Card) */}
                              {isLevel1Expanded && level2Children.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                  {level2Children.map((level2Row, level2Idx) => {
                                    return (
                                      <div
                                        key={`ts-sub-card-${level2Row.id}-${level2Idx}`}
                                        className="rounded-[8px] border border-gray-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 p-3 shadow-xs space-y-2 text-[12px]"
                                      >
                                        <div className="flex items-center justify-between gap-2 border-b border-gray-200/60 dark:border-zinc-800 pb-1.5">
                                          <span className="font-semibold text-[11px] sm:text-[12px] leading-snug text-[#111827] dark:text-white whitespace-normal break-words flex-1">
                                            {level2Row.code ? `${level2Row.code} - ${level2Row.name}` : level2Row.name}
                                          </span>
                                          {!readonly && canUpdateTsProgram && (
                                            <button
                                              type="button"
                                              onClick={() => onEditRow(level2Row)}
                                              className="shrink-0 size-7 cursor-pointer rounded-[6px] text-gray-700 dark:text-white bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-800 p-1 transition-colors flex items-center justify-center"
                                              aria-label={level2Row.apportioning === true && level2Row.manualApportioning === true ? "View Sub-Program" : "Edit Sub-Program"}
                                            >
                                              {level2Row.apportioning === true && level2Row.manualApportioning === true ? (
                                                <Eye className="size-[14px] text-[#6C5DD3] dark:text-[#a799ff]" />
                                              ) : (
                                                <img
                                                  src={editIconImg}
                                                  alt="Edit"
                                                  aria-hidden="true"
                                                  className="size-[14px] object-contain dark:brightness-0 dark:invert opacity-70 hover:opacity-100 transition-opacity"
                                                />
                                              )}
                                            </button>
                                          )}
                                        </div>

                                        {/* Row by Row for Level 2 */}
                                        <div className="space-y-1.5">
                                          <div className="flex justify-between items-center text-[11px] pb-1 border-b border-gray-200/40 dark:border-zinc-800">
                                            <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                                              Status:
                                            </span>
                                            <span
                                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                                level2Row.active
                                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                              }`}
                                            >
                                              {level2Row.active ? (
                                                <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                                              ) : (
                                                <X className="size-2.5 text-rose-600 dark:text-rose-400" />
                                              )}
                                              {level2Row.active ? "Active" : "Inactive"}
                                            </span>
                                          </div>

                                          <div className="flex justify-between items-start text-[11px] pb-1 border-b border-gray-200/40 dark:border-zinc-800 gap-2">
                                            <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider shrink-0">
                                              Department:
                                            </span>
                                            <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                                              {level2Row.department || "—"}
                                            </span>
                                          </div>

                                          <div className="flex justify-between items-center text-[11px] pb-1 border-b border-gray-200/40 dark:border-zinc-800">
                                            <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                                              Medical %:
                                            </span>
                                            <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                                              {level2Row.medicalPct ?? "0.00"}%
                                            </span>
                                          </div>

                                          {level2Row.description ? (
                                            <div className="flex flex-col gap-0.5 text-[11px]">
                                              <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                                                Description:
                                              </span>
                                              <span className="font-medium text-[#111827] dark:text-[#e5e7eb] break-words">
                                                {level2Row.description}
                                              </span>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
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
