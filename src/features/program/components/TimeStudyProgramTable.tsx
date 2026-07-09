import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp, EllipsisVertical, Pencil, Plus, Eye } from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { api } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  ProgramRow,
  ProgramSortKey,
  ProgramTableSortState,
  TimeStudyProgramTableHandle,
  TimeStudyProgramTableProps,
  TimeStudyProgramResDto,
} from "../types"
import { usePermissions } from "@/hooks/usePermissions"

export const TimeStudyProgramTable = forwardRef<TimeStudyProgramTableHandle, TimeStudyProgramTableProps>(
  function TimeStudyProgramTable({
    rows,
    isLoading,
    onEditRow,
    onAddSubProgramFromParent,
    lastUpdatedRow,
    readonly = false,
  }: TimeStudyProgramTableProps, ref) {
  const { canAdd, canUpdate } = usePermissions()
  const canAddTsProgram = canAdd("timestudyprogram") && !readonly
  const canUpdateTsProgram = canUpdate("timestudyprogram") && !readonly

  const [sortState, setSortState] = useState<ProgramTableSortState>({
    key: "code",
    direction: "none",
  })
  const [tooltipOpenKey, setTooltipOpenKey] = useState<ProgramSortKey | null>(null)
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({})
  const [childrenByParentId, setChildrenByParentId] = useState<Record<string, ProgramRow[]>>({})
  const [childrenLoading, setChildrenLoading] = useState<Record<string, boolean>>({})
  const [patchedRows, setPatchedRows] = useState<Record<string, ProgramRow>>({})
  const childrenInFlightRef = useRef(new Set<string>())

  useImperativeHandle(ref, () => ({
    collapseRow: (rowId: string) => {
      setChildrenByParentId((prevC) => {
        const nextC = { ...prevC }
        const idsToClear = new Set<string>([rowId])
        const queue = [rowId]

        // Find all descendant IDs
        while (queue.length > 0) {
          const currentId = queue.shift()!
          const children = nextC[currentId]
          if (children) {
            for (const child of children) {
              idsToClear.add(child.id)
              queue.push(child.id)
            }
          }
          delete nextC[currentId]
        }

        // Clear inflight refs and expanded state for all descendants
        idsToClear.forEach((id) => {
          childrenInFlightRef.current.delete(id)
        })

        setExpandedPrograms((prevE) => {
          const nextE = { ...prevE }
          idsToClear.forEach((id) => {
            nextE[id] = false
          })
          return nextE
        })

        return nextC
      })
    },
    patchTimeStudyProgramRow: (updatedRow: ProgramRow) => {
      setPatchedRows((prev) => {
        const next = { ...prev, [updatedRow.id]: updatedRow }
        // If this is a Primary or Secondary, clear its children from patchedRows
        // so they show their fresh status from the backend on re-expand.
        Object.keys(next).forEach((key) => {
          const row = next[key]
          if (row.parentId === updatedRow.id) {
            delete next[key]
          }
        })
        return next
      })
    },
  }), [])

  const mergedRows = useMemo(() => {
    const children = Object.values(childrenByParentId).flat()
    return [...rows, ...children]
  }, [childrenByParentId, rows])

  const sortByKey = (left: ProgramRow, right: ProgramRow) => {
    const leftValue = sortState.key === "code" ? left.code : left.name
    const rightValue = sortState.key === "code" ? right.code : right.name
    const compare = leftValue.localeCompare(rightValue, undefined, {
      numeric: true,
      sensitivity: "base",
    })
    return sortState.direction === "asc" ? compare : -compare
  }

  const sortedPrograms = useMemo(() => {
    const result = mergedRows.filter((row) => row.hierarchyLevel === 0)
    if (sortState.direction === "none") return result
    return [...result].sort(sortByKey)
  }, [mergedRows, sortState])

  const displayRows = useMemo(() => {
    const flattened: ProgramRow[] = []

    const applyUpdatedRow = (row: ProgramRow): ProgramRow => {
      if (patchedRows[row.id]) {
        return {
          ...row,
          ...patchedRows[row.id],
        }
      }
      if (lastUpdatedRow && row.id === lastUpdatedRow.id) {
        return {
          ...row,
          ...lastUpdatedRow,
        }
      }
      return row
    }

    for (const primary of sortedPrograms) {
      const effectivePrimary = applyUpdatedRow(primary)
      flattened.push(effectivePrimary)

      if (!expandedPrograms[primary.id]) continue

      // Level 1: secondaries stored under the primary's id
      const secondaries = childrenByParentId[primary.id] ?? []

      for (const sec of secondaries) {
        const effectiveSecondary = applyUpdatedRow(sec)
        flattened.push({
          ...effectiveSecondary,
          // L1 parent is the TS Primary — stamp its active status
          parentActive: effectivePrimary.active,
        })

        // Only show subprograms if this secondary is expanded
        if (!expandedPrograms[sec.id]) continue

        // Level 2: subprograms stored under the secondary's own id
        const subprograms = childrenByParentId[sec.id] ?? []
        for (const sub of subprograms) {
          flattened.push({
            ...applyUpdatedRow(sub),
            // L2 parent is the TS Secondary — stamp its active status
            parentActive: effectiveSecondary.active,
          })
        }
      }
    }
    return flattened
  }, [expandedPrograms, sortedPrograms, childrenByParentId, lastUpdatedRow, patchedRows])

  const mapTimeStudyChildToRow = (
    raw: TimeStudyProgramResDto,
    hierarchyLevel: 1 | 2,
    fallbackParentId: string,
    parentName?: string,
    parentCode?: string
  ): ProgramRow => {
    const id = raw.id == null ? "" : String(raw.id)
    const code = raw.code == null ? "" : String(raw.code)
    const name = raw.name == null ? "" : String(raw.name)
    const departmentName =
      raw.department && typeof raw.department.name === "string" ? raw.department.name : ""
    const parentBudgetUnitName =
      raw.budgetProgram && typeof raw.budgetProgram.name === "string"
        ? raw.budgetProgram.name
        : undefined
    const parentBudgetUnitCode =
      raw.budgetProgram && typeof raw.budgetProgram.code === "string"
        ? raw.budgetProgram.code
        : undefined
    const timeStudyBudgetProgramId =
      raw.budgetProgram && typeof raw.budgetProgram.id === "number"
        ? String(raw.budgetProgram.id)
        : undefined

    return {
      id,
      tab: "Time Study programs",
      code,
      name,
      description: "",
      medicalPct: "0.00",
      department: departmentName,
      active: raw.status === "active",
      parentBudgetUnitName,
      parentBudgetUnitCode,
      parentProgramName: parentName,
      parentProgramCode: parentCode,
      hierarchyLevel,
      parentId: raw.parentId ? String(raw.parentId) : fallbackParentId,
      type: hierarchyLevel === 1 ? "secondary" : "subprogram",
      timeStudyBudgetProgramId,
      costAllocation: raw.costAllocation === true,
      isMultiCode: raw.isMultiCode === true,
      apportioning: raw.apportioning === true,
      manualApportioning: raw.manualApportioning === true,
    }
  }

  /**
   * Lazy-load children for a given row:
   * - Level 0 (primary): fetches `type=secondary`, stores under primary's id
   * - Level 1 (secondary): fetches `type=subprogram` filtered by parentId, stores under secondary's id
   */
  const ensureChildrenLoaded = async (row: ProgramRow) => {
    const rowId = row.id
    if (childrenInFlightRef.current.has(rowId)) return

    const isLevel0 = (row.hierarchyLevel ?? 0) === 0

    // For level 0 we need the budget program id; for level 1 we use the secondary's own id as parentId filter
    if (isLevel0 && !row.timeStudyBudgetProgramId) return

    childrenInFlightRef.current.add(rowId)
    setChildrenLoading((prev) => ({ ...prev, [rowId]: true }))
    try {
      const search = new URLSearchParams()
      search.set("page", "1")
      search.set("limit", "100")
      search.set("sort", "ASC")

      if (isLevel0) {
        // Fetch direct secondary children of this primary
        search.set("type", "secondary")
        search.set("budgetProgramId", row.timeStudyBudgetProgramId!)
      } else {
        // Fetch subprograms that belong to this secondary
        search.set("type", "subprogram")
        // Use the secondary's timeStudyBudgetProgramId to scope the API call
        if (row.timeStudyBudgetProgramId) {
          search.set("budgetProgramId", row.timeStudyBudgetProgramId)
        }
      }

      const response = await api.get<any>(`/timestudyprograms?${search.toString()}`)
      const payload = response?.data ?? response
      const list: any[] = Array.isArray(payload?.data) ? payload.data : []

      // Direct match: child's parentId must match the current row's id
      const filtered = list.filter(
        (item: any) => String(item.parentId) === String(row.id)
      )

      const mapped: ProgramRow[] = filtered.map((item) =>
        mapTimeStudyChildToRow(item, isLevel0 ? 1 : 2, rowId, row.name, row.code)
      )
      mapped.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      )

      setChildrenByParentId((prev) => ({ ...prev, [rowId]: mapped }))

      setPatchedRows((prev) => {
        const next = { ...prev }
        mapped.forEach((r) => {
          delete next[r.id]
        })
        return next
      })
    } finally {
      childrenInFlightRef.current.delete(rowId)
      setChildrenLoading((prev) => ({ ...prev, [rowId]: false }))
    }
  }

  const handleSort = (key: ProgramSortKey) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
      if (prev.direction === "desc") return { key, direction: "none" }
      return { key, direction: "asc" }
    })
  }

  const getTooltipText = (key: ProgramSortKey) => {
    const isActive = sortState.key === key
    if (!isActive || sortState.direction === "none") return "Click to sort ascending"
    if (sortState.direction === "asc") return "Click to sort descending"
    return "Click to cancel sorting"
  }

  const skeletonRows = Array.from({ length: 8 }, (_, index) => `ts-program-skeleton-${index}`)

  interface TsPrimaryNode {
    primaryRow: ProgramRow;
    secondaries: TsSecondaryNode[];
  }

  interface TsSecondaryNode {
    secondaryRow: ProgramRow;
    subPrograms: ProgramRow[];
  }

  const tsCards = useMemo(() => {
    const cards: TsPrimaryNode[] = [];
    let currentPrimary: TsPrimaryNode | null = null;
    let currentSecondary: TsSecondaryNode | null = null;

    for (const row of displayRows) {
      if (row.hierarchyLevel === 0) {
        currentPrimary = {
          primaryRow: row,
          secondaries: [],
        };
        cards.push(currentPrimary);
        currentSecondary = null;
      } else if (row.hierarchyLevel === 1) {
        if (currentPrimary) {
          currentSecondary = {
            secondaryRow: row,
            subPrograms: [],
          };
          currentPrimary.secondaries.push(currentSecondary);
        }
      } else if (row.hierarchyLevel === 2) {
        if (currentSecondary) {
          currentSecondary.subPrograms.push(row);
        }
      }
    }
    return cards;
  }, [displayRows]);

  return (
    <>
      {/* Mobile/Tablet Card View */}
      <div className="block xl:hidden space-y-4">
        {isLoading ? (
          skeletonRows.map((rowId) => (
            <div
              key={`skeleton-card-${rowId}`}
              className="rounded-[10px] border border-[#E5E7EB] bg-white p-4 space-y-2.5 shadow-sm"
            >
              <Skeleton className="h-4 w-[40%]" />
              <Skeleton className="h-4 w-[80%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          ))
        ) : tsCards.length === 0 ? (
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-8 text-center text-[13px] text-[#6B7280] shadow-sm">
            <img
              src={tableEmptyIcon}
              alt=""
              aria-hidden="true"
              className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
            />
            <p className="mt-2 text-gray-500">No records found.</p>
          </div>
        ) : (
          tsCards.map((primaryNode) => {
            const primaryRow = primaryNode.primaryRow;
            return (
              <div
                key={`primary-card-${primaryRow.id}`}
                className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden flex flex-col hover:border-[#6C5DD3]/40 transition-colors"
              >
                {/* Primary Program Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-2.5 gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const nextExpanded = !expandedPrograms[primaryRow.id]
                        childrenInFlightRef.current.delete(primaryRow.id)
                        if (nextExpanded) {
                          setChildrenByParentId((prevC) => {
                            const updated = { ...prevC }
                            delete updated[primaryRow.id]
                            return updated
                          })
                          setExpandedPrograms((prev) => ({ ...prev, [primaryRow.id]: true }))
                          void ensureChildrenLoaded(primaryRow)
                        } else {
                          setExpandedPrograms((prev) => {
                            const secondaries = childrenByParentId[primaryRow.id] ?? []
                            const next = { ...prev, [primaryRow.id]: false }
                            secondaries.forEach((s) => { next[s.id] = false })
                            return next
                          })
                          setChildrenByParentId((prevC) => {
                            const updated = { ...prevC }
                            delete updated[primaryRow.id]
                            return updated
                          })
                        }
                      }}
                      className="text-white hover:bg-white/10 p-0.5 rounded shrink-0"
                      aria-label="Toggle TS primary children"
                    >
                      {expandedPrograms[primaryRow.id] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                    </button>
                    <span className="text-[13px] font-bold text-white shrink-0 inline-flex items-center">
                      {primaryRow.code}
                      {primaryRow.isMultiCode && (
                        <span className="text-white font-bold ml-0.5 text-[12px] -translate-y-1">**</span>
                      )}
                    </span>
                    <span className="text-[12px] text-white/80 truncate">
                      - {primaryRow.name}
                    </span>
                  </div>
                  {!readonly && canUpdateTsProgram && (
                    primaryRow.apportioning === true && primaryRow.manualApportioning === true ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => onEditRow(primaryRow)}
                              className="inline-flex size-6 cursor-pointer items-center justify-center rounded-[6px] bg-white/20 text-white hover:bg-white/30"
                              aria-label="View TS program"
                            >
                              <Eye className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={6} className="z-[150] !inline-block rounded-[8px] border-0 bg-black px-3 py-2.5 text-left text-[12px] font-medium leading-relaxed text-white shadow-lg">
                            Auto-created manual program cannot be modified
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onEditRow(primaryRow)}
                        className="inline-flex size-6 cursor-pointer items-center justify-center rounded-[6px] bg-white/20 text-white hover:bg-white/30"
                        aria-label="Edit row"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                    )
                  )}
                </div>

                {/* Primary Program Body */}
                <div className="p-4 bg-white text-[12.5px] text-gray-700 space-y-2.5">
                  <div className="flex justify-between items-baseline gap-x-2 border-b border-gray-50 pb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">BU Program:</span>
                    <span className="font-medium text-gray-600 truncate max-w-[70%]">{primaryRow.parentBudgetUnitName || "—"}</span>
                  </div>
                  <div className="flex justify-between items-baseline gap-x-2 border-b border-gray-50 pb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">Department:</span>
                    <span className="font-normal text-gray-600 text-right break-words min-w-0 max-w-[70%]">{primaryRow.department || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-50 pb-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">MultiCodes:</span>
                    <img
                      src={primaryRow.isMultiCode ? tableCheckIcon : tableCloseIcon}
                      alt=""
                      className="size-3.5 object-contain"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">Active:</span>
                    <img
                      src={primaryRow.active ? tableCheckIcon : tableCloseIcon}
                      alt=""
                      className="size-3.5 object-contain"
                    />
                  </div>

                  {/* Secondary programs nested inside primary */}
                  {expandedPrograms[primaryRow.id] && (
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                      {childrenLoading[primaryRow.id] && primaryNode.secondaries.length === 0 ? (
                        <div className="p-2 space-y-2">
                          <Skeleton className="h-3 w-[40%]" />
                          <Skeleton className="h-3 w-[70%]" />
                        </div>
                      ) : primaryNode.secondaries.length === 0 ? (
                        <div className="text-center py-2 text-[11.5px] text-gray-400">No secondary programs loaded.</div>
                      ) : (
                        primaryNode.secondaries.map((secNode) => {
                          const secondaryRow = secNode.secondaryRow;
                          return (
                            <div
                              key={`nested-sec-${secondaryRow.id}`}
                              className="rounded-[8px] border border-gray-100 bg-[#fbfbfe] overflow-hidden flex flex-col shadow-xs"
                            >
                              {/* Secondary Program Header */}
                              <div className="flex items-center justify-between bg-[#6C5DD3]/10 px-3 py-1.5 gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const nextExpanded = !expandedPrograms[secondaryRow.id]
                                      childrenInFlightRef.current.delete(secondaryRow.id)
                                      if (nextExpanded) {
                                        setChildrenByParentId((prevC) => {
                                          const updated = { ...prevC }
                                          delete updated[secondaryRow.id]
                                          return updated
                                        })
                                        setExpandedPrograms((prev) => ({ ...prev, [secondaryRow.id]: true }))
                                        void ensureChildrenLoaded(secondaryRow)
                                      } else {
                                        setExpandedPrograms((prev) => ({ ...prev, [secondaryRow.id]: false }))
                                        setChildrenByParentId((prevC) => {
                                          const updated = { ...prevC }
                                          delete updated[secondaryRow.id]
                                          return updated
                                        })
                                      }
                                    }}
                                    className="text-(--primary) hover:bg-(--primary)/5 p-0.5 rounded shrink-0"
                                    aria-label="Toggle TS secondary children"
                                  >
                                    {expandedPrograms[secondaryRow.id] ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                                  </button>
                                  <span className="text-[12px] font-bold text-(--primary) shrink-0 inline-flex items-center">
                                    {secondaryRow.code}
                                    {secondaryRow.isMultiCode && (
                                      <span className="text-(--primary) font-bold ml-0.5 text-[11px] -translate-y-1">**</span>
                                    )}
                                  </span>
                                  <span className="text-[11.5px] text-gray-700 truncate">
                                    - {secondaryRow.name}
                                  </span>
                                </div>
                                {!readonly && (canAddTsProgram || canUpdateTsProgram) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="inline-flex size-5 cursor-pointer items-center justify-center rounded-[4px] bg-white/60 text-(--primary) hover:bg-white/90 shadow-xs border border-gray-100 outline-none"
                                        aria-label="Open row actions"
                                      >
                                        <EllipsisVertical className="size-3" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      align="end"
                                      side="bottom"
                                      className="w-[92px] rounded-[6px] border border-[#edf0f6] p-1 shadow-lg bg-white z-[150]"
                                    >
                                      {canAddTsProgram && secondaryRow.active && !(secondaryRow.apportioning === true && secondaryRow.manualApportioning === true) && (
                                        <DropdownMenuItem
                                          onClick={() => onAddSubProgramFromParent?.(secondaryRow)}
                                          className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[11.5px] text-[#111827]"
                                        >
                                          <Plus className="size-[12px] text-(--primary)" />
                                          Add
                                        </DropdownMenuItem>
                                      )}
                                      {canUpdateTsProgram && (
                                        <DropdownMenuItem
                                          onClick={() => onEditRow(secondaryRow)}
                                          className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[11.5px] text-[#111827]"
                                        >
                                          {secondaryRow.apportioning === true && secondaryRow.manualApportioning === true ? (
                                            <>
                                              <Eye className="size-[12px] text-(--primary)" />
                                              View
                                            </>
                                          ) : (
                                            <>
                                              <Pencil className="size-[12px] text-(--primary)" />
                                              Edit
                                            </>
                                          )}
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>

                              {/* Secondary Program Body */}
                              <div className="p-3 space-y-2 text-[11.5px] text-gray-600 bg-white/50">
                                <div className="flex justify-between items-baseline border-b border-gray-50/50 pb-1">
                                  <span className="font-semibold text-gray-500">BU Program:</span>
                                  <span>{secondaryRow.parentBudgetUnitName || "—"}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-gray-50/50 pb-1">
                                  <span className="font-semibold text-gray-500">Department:</span>
                                  <span>{secondaryRow.department || "—"}</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-50/50 pb-1">
                                  <span className="font-semibold text-gray-500">MultiCodes:</span>
                                  <img
                                    src={secondaryRow.isMultiCode ? tableCheckIcon : tableCloseIcon}
                                    alt=""
                                    className="size-3 object-contain"
                                  />
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-gray-500">Active:</span>
                                  <img
                                    src={secondaryRow.active ? tableCheckIcon : tableCloseIcon}
                                    alt=""
                                    className="size-3 object-contain"
                                  />
                                </div>

                                {/* Sub-programs nested inside secondary */}
                                {expandedPrograms[secondaryRow.id] && (
                                  <div className="mt-2.5 pt-2 border-t border-gray-100/50 space-y-2">
                                    <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Sub-Programs</div>
                                    <div className="space-y-2 pl-2 border-l border-gray-100">
                                      {secNode.subPrograms.map((subProg) => (
                                        <div
                                          key={`nested-sub-${subProg.id}`}
                                          className="p-2 rounded-[6px] border border-gray-50 bg-gray-50/40 flex flex-col gap-1.5"
                                        >
                                          <div className="flex justify-between items-center gap-1.5">
                                            <span className="text-[11.5px] font-bold text-gray-700 truncate">
                                              {subProg.code} - {subProg.name}
                                            </span>
                                            {!readonly && canUpdateTsProgram && (
                                              <button
                                                type="button"
                                                onClick={() => onEditRow(subProg)}
                                                className="text-gray-400 hover:text-(--primary) p-0.5 rounded"
                                                aria-label="Edit sub-program"
                                              >
                                                <Pencil className="size-3" />
                                              </button>
                                            )}
                                          </div>
                                          <div className="grid grid-cols-2 gap-x-2 text-[10.5px] text-gray-500">
                                            <div>Dept: {subProg.department || "—"}</div>
                                            <div>Active: {subProg.active ? "Yes" : "No"}</div>
                                          </div>
                                        </div>
                                      ))}

                                      {childrenLoading[secondaryRow.id] && (
                                        <div className="p-2 space-y-1 bg-gray-50/40 rounded">
                                          <Skeleton className="h-2.5 w-[40%]" />
                                          <Skeleton className="h-2.5 w-[80%]" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block overflow-hidden rounded-[4px] border border-[#e6e7ef]">
        <div className="overflow-x-auto">
        <div className="program-table-scroll [scrollbar-gutter:stable]">
          <Table className="table-fixed min-w-[970px]">
            <colgroup>
              <col style={{ width: "140px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "80px" }} />
              {!readonly && <col style={{ width: "80px" }} />}
            </colgroup>
            <TableHeader className="sticky top-0 z-10 bg-(--primary) shadow-[0_1px_0_rgba(0,0,0,0.05)] [&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-[12px] font-medium text-white">
                  <TooltipProvider>
                    <Tooltip open={tooltipOpenKey === "code"}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSort("code")}
                          onMouseEnter={() => setTooltipOpenKey("code")}
                          onMouseLeave={() => setTooltipOpenKey(null)}
                          onFocus={() => setTooltipOpenKey("code")}
                          onBlur={() => setTooltipOpenKey(null)}
                          className="relative flex h-full w-full cursor-pointer items-center justify-start pr-4 text-left text-white"
                        >
                          <span>TS Code</span>
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                            <ChevronUp
                              className={`size-[10px] ${
                                sortState.key === "code" && sortState.direction === "asc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                            <ChevronDown
                              className={`-mt-1 size-[10px] ${
                                sortState.key === "code" && sortState.direction === "desc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        {getTooltipText("code")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-[12px] font-medium text-white">
                  <TooltipProvider>
                    <Tooltip open={tooltipOpenKey === "name"}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSort("name")}
                          onMouseEnter={() => setTooltipOpenKey("name")}
                          onMouseLeave={() => setTooltipOpenKey(null)}
                          onFocus={() => setTooltipOpenKey("name")}
                          onBlur={() => setTooltipOpenKey(null)}
                          className="relative flex h-full w-full cursor-pointer items-center justify-start pr-4 text-left text-white"
                        >
                          <span>TS Program</span>
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                            <ChevronUp
                              className={`size-[10px] ${
                                sortState.key === "name" && sortState.direction === "asc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                            <ChevronDown
                              className={`-mt-1 size-[10px] ${
                                sortState.key === "name" && sortState.direction === "desc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        {getTooltipText("name")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-[12px] font-medium text-white">
                  BU Program
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-[12px] font-medium text-white">
                  Department
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-[12px] font-medium text-white">
                  MultiCodes
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                  Active
                </TableHead>
                {!readonly && (
                  <TableHead className="h-10 border-r-0 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                    Action
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? skeletonRows.map((rowId) => (
                    <TableRow key={rowId} className="h-10 border-b border-[#eff0f5] hover:bg-transparent">
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[70%]" /></TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[80%]" /></TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[65%]" /></TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[80%]" /></TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[55%]" /></TableCell>
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="mx-auto h-4 w-4 rounded-sm" /></TableCell>
                      {!readonly && (
                        <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="mx-auto h-3.5 w-3.5 rounded-sm" /></TableCell>
                      )}
                    </TableRow>
                  ))
                : displayRows.map((row) => (
                    <React.Fragment key={row.id}>
                    <TableRow className="min-h-[40px] border-b border-[#eff0f5] hover:bg-transparent">
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[140px]">
                        <div
                          className="flex items-center gap-1"
                          style={{
                            paddingLeft:
                              row.hierarchyLevel === 1 ? "14px" : row.hierarchyLevel === 2 ? "28px" : "0px",
                          }}
                        >
                          {(row.hierarchyLevel === 0 || row.hierarchyLevel === 1) ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                const nextExpanded = !expandedPrograms[row.id]
                                if (nextExpanded) {
                                  // Always fetch fresh — clear stale data and inflight guard first
                                  childrenInFlightRef.current.delete(row.id)
                                  setChildrenByParentId((prevC) => {
                                    const updated = { ...prevC }
                                    delete updated[row.id]
                                    return updated
                                  })
                                  setExpandedPrograms((prev) => ({ ...prev, [row.id]: true }))
                                  void ensureChildrenLoaded(row)
                                } else {
                                  // On collapse: clear inflight guard and children
                                  childrenInFlightRef.current.delete(row.id)
                                  if (row.hierarchyLevel === 0) {
                                    // Auto-collapse all secondaries under this primary
                                    setExpandedPrograms((prev) => {
                                      const secondaries = childrenByParentId[row.id] ?? []
                                      const next = { ...prev, [row.id]: false }
                                      secondaries.forEach((s) => { next[s.id] = false })
                                      return next
                                    })
                                    setChildrenByParentId((prevC) => {
                                      const updated = { ...prevC }
                                      delete updated[row.id]
                                      return updated
                                    })
                                  } else {
                                    setExpandedPrograms((prev) => ({ ...prev, [row.id]: false }))
                                    setChildrenByParentId((prevC) => {
                                      const updated = { ...prevC }
                                      delete updated[row.id]
                                      return updated
                                    })
                                  }
                                }
                              }}
                              className="inline-flex cursor-pointer items-center text-(--primary)"
                              aria-label={row.hierarchyLevel === 0 ? "Toggle TS secondary programs" : "Toggle TS subprograms"}
                            >
                              {expandedPrograms[row.id] ? (
                                <ChevronUp className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </button>
                          ) : null}
                          <span className="inline-flex items-center">
                            {row.code}
                            {row.isMultiCode && (
                              <span className="text-[var(--primary)] font-bold ml-0.5 text-[12px] -translate-y-1">**</span>
                            )}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[220px]">
                        {row.name}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[170px]">
                        {row.parentBudgetUnitName ?? ""}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[170px]">
                        {row.department}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                        <img src={row.isMultiCode ? tableCheckIcon : tableCloseIcon} alt="" aria-hidden="true" className="mx-auto size-[12px] object-contain" />
                      </TableCell>
                       <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                        <img src={row.active ? tableCheckIcon : tableCloseIcon} alt="" aria-hidden="true" className="mx-auto size-[12px] object-contain" />
                      </TableCell>
      {!readonly && (
      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
        {row.hierarchyLevel === 1
          ? // Sub-Program One: 3-dot menu with Add + Edit (mirrors BU Program in BudgetUnitTable)
            (canAddTsProgram || canUpdateTsProgram) && (
              <div className="flex justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex cursor-pointer items-center justify-center text-(--primary) opacity-90 transition-opacity hover:opacity-100"
                      aria-label="Open row actions"
                    >
                      <EllipsisVertical className="size-[14px]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    side="bottom"
                    sideOffset={6}
                    className="w-[92px]! min-w-[92px]! rounded-[6px] border border-[#edf0f6] p-1 shadow-[0_8px_20px_rgba(17,24,39,0.14)]"
                  >
                    {canAddTsProgram && row.active && !(row.apportioning === true && row.manualApportioning === true) && (
                      <DropdownMenuItem
                        onClick={() => onAddSubProgramFromParent?.(row)}
                        className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[12px] text-[#111827]"
                      >
                        <Plus className="size-[13px] text-(--primary)" />
                        Add
                      </DropdownMenuItem>
                    )}
                    {canUpdateTsProgram && (
                      <DropdownMenuItem
                        onClick={() => onEditRow(row)}
                        className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[12px] text-[#111827]"
                      >
                        {row.apportioning === true && row.manualApportioning === true ? (
                          <>
                            <Eye className="size-[13px] text-(--primary)" />
                            View
                          </>
                        ) : (
                          <>
                            <Pencil className="size-[13px] text-(--primary)" />
                            Edit
                          </>
                        )}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          : // Primary (level 0) and Sub-Program Two (level 2): plain edit icon only
            canUpdateTsProgram && (
              row.apportioning === true && row.manualApportioning === true ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => onEditRow(row)}
                        className="inline-flex cursor-pointer items-center opacity-80 drop-shadow-[0_1px_0_rgba(108,93,211,0.35)] transition-opacity hover:opacity-100"
                        aria-label="View TS program"
                      >
                        <Eye className="size-[13px] text-(--primary)" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6} className="z-50 !inline-block rounded-[8px] border-0 bg-black px-3 py-2.5 text-left text-[12px] font-medium leading-relaxed text-white shadow-lg">
                      Auto-created manual program cannot be modified
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <button
                  type="button"
                  onClick={() => onEditRow(row)}
                  className="inline-flex cursor-pointer items-center opacity-80 drop-shadow-[0_1px_0_rgba(108,93,211,0.35)] transition-opacity hover:opacity-100"
                >
                  <img
                    src={tableEditIcon}
                    alt=""
                    aria-hidden="true"
                    className="size-[11px] object-contain"
                  />
                </button>
              )
            )}
      </TableCell>
      )}
                    </TableRow>
                    {(row.hierarchyLevel === 0 || row.hierarchyLevel === 1) &&
                      expandedPrograms[row.id] &&
                      childrenLoading[row.id] && (
                        <TableRow
                          key={`ts-loading-${row.id}`}
                          className="h-10 border-b border-[#eff0f5] hover:bg-transparent"
                        >
                          <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                            <Skeleton className="h-3.5 w-[70%]" />
                          </TableCell>
                          <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                            <Skeleton className="h-3.5 w-[80%]" />
                          </TableCell>
                          <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                            <Skeleton className="h-3.5 w-[65%]" />
                          </TableCell>
                          <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                            <Skeleton className="h-3.5 w-[80%]" />
                          </TableCell>
                          <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                            <Skeleton className="h-3.5 w-[55%]" />
                          </TableCell>
                          <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                            <Skeleton className="mx-auto h-4 w-4 rounded-sm" />
                          </TableCell>
                          {!readonly && (
                          <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                            <Skeleton className="mx-auto h-3.5 w-3.5 rounded-sm" />
                          </TableCell>
                          )}
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
              {!isLoading && displayRows.length === 0 ? (
                <TableRow className="h-[210px] hover:bg-transparent">
                  <TableCell colSpan={readonly ? 6 : 7} className="text-center">
                    <img
                      src={tableEmptyIcon}
                      alt=""
                      aria-hidden="true"
                      className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
                    />
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  </>
  )
}
)

TimeStudyProgramTable.displayName = "TimeStudyProgramTable"
