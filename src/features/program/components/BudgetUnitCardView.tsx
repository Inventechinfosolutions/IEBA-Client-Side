import type { ReactNode } from "react"
import { Check, ChevronDown, ChevronRight, ChevronUp, EllipsisVertical, Pencil, Plus, X } from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import editIconImg from "@/assets/edit-icon.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { DisplayHierarchyRow, ProgramRow } from "../types"

export type BudgetUnitCardViewProps = {
  hierarchyRows: DisplayHierarchyRow[]
  isLoading?: boolean
  readonly?: boolean
  canAddBudgetProgram?: boolean
  canUpdateBudgetProgram?: boolean
  expandedBudgetUnits: Record<string, boolean>
  expandedProgramGroups: Record<string, boolean>
  expandedPrograms: Record<string, boolean>
  subProgramLoadingProgramId: string | null
  onEditRow: (row: ProgramRow) => void
  onAddSubProgramFromProgram?: (row: ProgramRow) => void
  toggleBudgetUnit: (budgetUnitId: string) => void
  toggleProgramGroup: (budgetUnitId: string) => void
  toggleProgram: (budgetUnitId: string, programId: string) => void
  footer?: ReactNode
}

export function BudgetUnitCardView({
  hierarchyRows,
  isLoading,
  readonly = false,
  canAddBudgetProgram = false,
  canUpdateBudgetProgram = false,
  expandedBudgetUnits,
  expandedProgramGroups,
  expandedPrograms,
  subProgramLoadingProgramId,
  onEditRow,
  onAddSubProgramFromProgram,
  toggleBudgetUnit,
  toggleProgramGroup,
  toggleProgram,
  footer,
}: BudgetUnitCardViewProps) {
  // Extract all Level 0 Budget Units from hierarchyRows
  const budgetUnitRows = hierarchyRows.filter(
    (item): item is Extract<DisplayHierarchyRow, { kind: "data" }> =>
      item.kind === "data" && (item.row.hierarchyLevel ?? 0) === 0
  )

  return (
    <div className="block xl:hidden space-y-4 w-full">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`bu-card-skeleton-${idx}`}
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
      ) : budgetUnitRows.length === 0 ? (
        <div className="rounded-[12px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No budget units found"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[14px] font-medium text-gray-500 dark:text-zinc-400">
            No budget units found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {budgetUnitRows.map((buItem, buIdx) => {
            const buRow = buItem.row
            const buId = buRow.id
            const isBuExpanded = Boolean(expandedBudgetUnits[buId])

            // Find group header item for this BU
            const groupRowItem = hierarchyRows.find(
              (item) => item.kind === "group" && item.budgetUnitId === buId
            )

            // Find Level 2 BU Program items belonging to this BU
            const level2Items = hierarchyRows.filter(
              (item): item is Extract<DisplayHierarchyRow, { kind: "data" }> =>
                item.kind === "data" &&
                item.row.hierarchyLevel === 2 &&
                item.row.parentId === buId
            )

            return (
              <div
                key={`bu-card-parent-${buId}-${buIdx}`}
                className="history-card rounded-[12px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
              >
                {/* Level 0 Card Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-3.5 py-1.5 text-white gap-2">
                  <span className="font-semibold text-[12px] sm:text-[13px] leading-tight whitespace-normal break-words flex-1 min-w-0">
                    {buRow.code ? `${buRow.code} - ${buRow.name}` : buRow.name}
                  </span>
                  {!readonly && canUpdateBudgetProgram && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditRow(buRow)
                      }}
                      className="shrink-0 size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 transition-colors flex items-center justify-center"
                      aria-label="Edit Budget Unit"
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

                {/* Level 0 Card Body */}
                <div className="p-4 space-y-2.5 bg-white dark:bg-[#0c0d12]">
                  {/* Row 1: Status */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Status:
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        buRow.active
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                      }`}
                    >
                      {buRow.active ? (
                        <Check className="size-3 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <X className="size-3 text-rose-600 dark:text-rose-400" />
                      )}
                      {buRow.active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Row 2: Department */}
                  <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-zinc-800 gap-2">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                      Department:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px] text-right break-words max-w-[70%]">
                      {buRow.department || "—"}
                    </span>
                  </div>

                  {/* Row 3: Medical % */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                      Medical %:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px]">
                      {buRow.medicalPct ?? "0.00"}%
                    </span>
                  </div>

                  {/* Row 4: Description */}
                  {buRow.description ? (
                    <div className="flex flex-col gap-0.5 pb-2 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                        Description:
                      </span>
                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-[12px] break-words">
                        {buRow.description}
                      </span>
                    </div>
                  ) : null}

                  {/* Toggle Button for BU Programs */}
                  <button
                    type="button"
                    onClick={() => toggleBudgetUnit(buId)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[#F5F3FF] dark:bg-zinc-900 text-[#6C5DD3] dark:text-[#a799ff] text-[12px] font-semibold hover:bg-[#ECE9FE] transition-colors cursor-pointer"
                  >
                    {isBuExpanded ? (
                      <>
                        Hide BU Programs <ChevronDown className="size-3.5" />
                      </>
                    ) : (
                      <>
                        View BU Programs <ChevronRight className="size-3.5" />
                      </>
                    )}
                  </button>

                  {/* NESTED CHILDREN (Rendered INSIDE parent card body) */}
                  {isBuExpanded && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-purple-100 dark:border-purple-900/40">
                      {/* Level 1 Group Header Banner */}
                      {groupRowItem && groupRowItem.kind === "group" && (
                        <div
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-purple-100/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-[12px] font-medium text-[#6C5DD3] dark:text-[#a799ff] cursor-pointer"
                          onClick={() => toggleProgramGroup(buId)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedProgramGroups[buId] ? (
                              <ChevronDown className="size-4" />
                            ) : (
                              <ChevronRight className="size-4" />
                            )}
                            <span>{groupRowItem.label}</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-700 dark:text-purple-300">
                            {expandedProgramGroups[buId] ? "Hide Programs" : "Show Programs"}
                          </span>
                        </div>
                      )}

                      {/* Level 2 BU Program Cards */}
                      {expandedProgramGroups[buId] && (
                        <div className="space-y-3 pl-1 sm:pl-2">
                          {level2Items.map((progItem, progIdx) => {
                            const progRow = progItem.row
                            const progId = progRow.id
                            const programExpandKey = `${buId}:${progId}`
                            const isProgExpanded = Boolean(expandedPrograms[programExpandKey])
                            const isSubLoading = subProgramLoadingProgramId === progId

                            // Level 3 Sub-Programs for this BU Program
                            const level3Items = hierarchyRows.filter(
                              (item): item is Extract<DisplayHierarchyRow, { kind: "data" }> =>
                                item.kind === "data" &&
                                item.row.hierarchyLevel === 3 &&
                                item.row.parentId === progId
                            )

                            return (
                              <div
                                key={`prog-card-${progId}-${progIdx}`}
                                className="rounded-[10px] border border-purple-200 dark:border-purple-900/60 bg-purple-50/30 dark:bg-zinc-900/40 shadow-sm overflow-hidden text-[13px] flex flex-col"
                              >
                                {/* Level 2 Header */}
                                <div className="flex items-center justify-between bg-purple-700 dark:bg-purple-800 px-3 py-1.5 text-white gap-2">
                                  <span className="font-semibold text-[11px] sm:text-[12px] leading-tight whitespace-normal break-words flex-1 min-w-0">
                                    {progRow.code ? `${progRow.code} - ${progRow.name}` : progRow.name}
                                  </span>
                                  {!readonly && (canAddBudgetProgram || canUpdateBudgetProgram) && (
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
                                        className="w-[100px] rounded-[6px] border border-[#edf0f6] p-1 shadow-md bg-white dark:bg-[#18181b]"
                                      >
                                        {canAddBudgetProgram && progRow.active && (
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              onAddSubProgramFromProgram?.(progRow)
                                            }}
                                            className="cursor-pointer gap-1.5 rounded px-2 py-1 text-[12px] text-[#111827] dark:text-white"
                                          >
                                            <Plus className="size-3.5 text-[#6C5DD3]" />
                                            Add
                                          </DropdownMenuItem>
                                        )}
                                        {canUpdateBudgetProgram && (
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              onEditRow(progRow)
                                            }}
                                            className="cursor-pointer gap-1.5 rounded px-2 py-1 text-[12px] text-[#111827] dark:text-white"
                                          >
                                            <Pencil className="size-3.5 text-[#6C5DD3]" />
                                            Edit
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>

                                {/* Level 2 Body */}
                                <div className="p-3 space-y-2 bg-white dark:bg-[#0c0d12]">
                                  {/* Row 1: Status */}
                                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                                      Status:
                                    </span>
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                        progRow.active
                                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                      }`}
                                    >
                                      {progRow.active ? (
                                        <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                                      ) : (
                                        <X className="size-2.5 text-rose-600 dark:text-rose-400" />
                                      )}
                                      {progRow.active ? "Active" : "Inactive"}
                                    </span>
                                  </div>

                                  {/* Row 2: Department */}
                                  <div className="flex justify-between items-start pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px] gap-2">
                                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider shrink-0">
                                      Department:
                                    </span>
                                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                                      {progRow.department || "—"}
                                    </span>
                                  </div>

                                  {/* Row 3: Medical % */}
                                  <div className="flex justify-between items-center pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                                    <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                                      Medical %:
                                    </span>
                                    <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                                      {progRow.medicalPct ?? "0.00"}%
                                    </span>
                                  </div>

                                  {/* Row 4: Description */}
                                  {progRow.description ? (
                                    <div className="flex flex-col gap-0.5 pb-2 border-b border-gray-100 dark:border-zinc-800 text-[12px]">
                                      <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider">
                                        Description:
                                      </span>
                                      <span className="font-medium text-[#111827] dark:text-[#e5e7eb] break-words">
                                        {progRow.description}
                                      </span>
                                    </div>
                                  ) : null}

                                  {/* Toggle Sub-Programs */}
                                  <button
                                    type="button"
                                    onClick={() => toggleProgram(buId, progId)}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-50 dark:bg-zinc-900 text-[#6C5DD3] dark:text-[#a799ff] text-[11px] font-semibold hover:bg-purple-100 transition-colors cursor-pointer"
                                  >
                                    {isProgExpanded ? (
                                      <>
                                        Hide Sub-Programs <ChevronDown className="size-3.5" />
                                      </>
                                    ) : (
                                      <>
                                        View Sub-Programs <ChevronRight className="size-3.5" />
                                      </>
                                    )}
                                  </button>

                                  {isSubLoading && (
                                    <div className="p-2 space-y-2 animate-pulse">
                                      <Skeleton className="h-3 w-1/2 rounded" />
                                      <Skeleton className="h-3 w-3/4 rounded" />
                                    </div>
                                  )}

                                  {/* Level 3 Sub-Programs (Nested inside Level 2 Card) */}
                                  {isProgExpanded && level3Items.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
                                      {level3Items.map((subItem, subIdx) => {
                                        const subRow = subItem.row
                                        return (
                                          <div
                                            key={`sub-card-${subRow.id}-${subIdx}`}
                                            className="rounded-[8px] border border-gray-200 dark:border-zinc-800 bg-slate-50/60 dark:bg-zinc-950/60 p-3 shadow-xs space-y-2 text-[12px]"
                                          >
                                            <div className="flex items-center justify-between gap-2 border-b border-gray-200/60 dark:border-zinc-800 pb-1.5">
                                              <span className="font-semibold text-[11px] sm:text-[12px] leading-snug text-[#111827] dark:text-white whitespace-normal break-words flex-1">
                                                {subRow.code ? `${subRow.code} - ${subRow.name}` : subRow.name}
                                              </span>
                                              {!readonly && canUpdateBudgetProgram && (
                                                <button
                                                  type="button"
                                                  onClick={() => onEditRow(subRow)}
                                                  className="shrink-0 size-7 cursor-pointer rounded-[6px] text-gray-700 dark:text-white bg-transparent hover:bg-gray-200 dark:hover:bg-zinc-800 p-1 transition-colors flex items-center justify-center"
                                                  aria-label="Edit Sub-Program"
                                                >
                                                  <img
                                                    src={editIconImg}
                                                    alt="Edit"
                                                    aria-hidden="true"
                                                    className="size-[14px] object-contain dark:brightness-0 dark:invert opacity-70 hover:opacity-100 transition-opacity"
                                                  />
                                                </button>
                                              )}
                                            </div>

                                            {/* Row by Row for Sub-Program */}
                                            <div className="space-y-1.5">
                                              <div className="flex justify-between items-center text-[11px] pb-1 border-b border-gray-200/40 dark:border-zinc-800">
                                                <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                                                  Status:
                                                </span>
                                                <span
                                                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                                    subRow.active
                                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                                  }`}
                                                >
                                                  {subRow.active ? (
                                                    <Check className="size-2.5 text-emerald-600 dark:text-emerald-400" />
                                                  ) : (
                                                    <X className="size-2.5 text-rose-600 dark:text-rose-400" />
                                                  )}
                                                  {subRow.active ? "Active" : "Inactive"}
                                                </span>
                                              </div>

                                              <div className="flex justify-between items-start text-[11px] pb-1 border-b border-gray-200/40 dark:border-zinc-800 gap-2">
                                                <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider shrink-0">
                                                  Department:
                                                </span>
                                                <span className="font-medium text-[#111827] dark:text-[#e5e7eb] text-right break-words max-w-[70%]">
                                                  {subRow.department || "—"}
                                                </span>
                                              </div>

                                              <div className="flex justify-between items-center text-[11px] pb-1 border-b border-gray-200/40 dark:border-zinc-800">
                                                <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                                                  Medical %:
                                                </span>
                                                <span className="font-medium text-[#111827] dark:text-[#e5e7eb]">
                                                  {subRow.medicalPct ?? "0.00"}%
                                                </span>
                                              </div>

                                              {subRow.description ? (
                                                <div className="flex flex-col gap-0.5 text-[11px]">
                                                  <span className="text-[#6B7280] dark:text-[#9ca3af] font-bold uppercase text-[9px] tracking-wider">
                                                    Description:
                                                  </span>
                                                  <span className="font-medium text-[#111827] dark:text-[#e5e7eb] break-words">
                                                    {subRow.description}
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
