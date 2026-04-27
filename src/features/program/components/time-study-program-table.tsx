import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp, EllipsisVertical, Pencil, Plus } from "lucide-react"

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
      childrenInFlightRef.current.delete(rowId)
      setChildrenByParentId((prev) => {
        const updated = { ...prev }
        delete updated[rowId]
        return updated
      })
      setExpandedPrograms((prev) => ({ ...prev, [rowId]: false }))
    },
    patchTimeStudyProgramRow: (updatedRow: ProgramRow) => {
      setPatchedRows((prev) => ({ ...prev, [updatedRow.id]: updatedRow }))
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
        flattened.push(effectiveSecondary)

        // Only show subprograms if this secondary is expanded
        if (!expandedPrograms[sec.id]) continue

        // Level 2: subprograms stored under the secondary's own id
        const subprograms = childrenByParentId[sec.id] ?? []
        for (const sub of subprograms) {
          flattened.push(applyUpdatedRow(sub))
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

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#e6e7ef]">
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
                          {row.code}
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
                    {canAddTsProgram && row.active && (
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
                        <Pencil className="size-[13px] text-(--primary)" />
                        Edit
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )
          : // Primary (level 0) and Sub-Program Two (level 2): plain edit icon only
            canUpdateTsProgram && (
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
  )
  }
)

TimeStudyProgramTable.displayName = "TimeStudyProgramTable"
