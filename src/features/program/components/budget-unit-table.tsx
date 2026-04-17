import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp, EllipsisVertical, Pencil, Plus } from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { api } from "@/lib/api"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  BudgetUnitTableHandle,
  BudgetUnitTableProps,
  DisplayHierarchyRow,
  ProgramRow,
  ProgramSortKey,
  ProgramTableSortState,
} from "../types"
import { BudgetProgramStatusEnum, BudgetProgramTypeEnum } from "../enums/enums"
import { usePermissions } from "@/hooks/usePermissions"

export const BudgetUnitTable = forwardRef<BudgetUnitTableHandle, BudgetUnitTableProps>(
  function BudgetUnitTable(
    {
      rows,
      isLoading,
      onEditRow,
      onAddSubProgramFromProgram,
      lastUpdatedRow,
      expandedBudgetUnits: externalExpandedBudgetUnits,
      setExpandedBudgetUnits: setExternalExpandedBudgetUnits,
      expandedProgramGroups: externalExpandedProgramGroups,
      setExpandedProgramGroups: setExternalExpandedProgramGroups,
      expandedPrograms: externalExpandedPrograms,
      setExpandedPrograms: setExternalExpandedPrograms,
      readonly = false,
    },
    ref,
  ) {
  const { canAdd, canUpdate } = usePermissions()
  const canAddBudgetProgram = canAdd("budgetprogram") && !readonly
  const canUpdateBudgetProgram = canUpdate("budgetprogram") && !readonly

  const [sortState, setSortState] = useState<ProgramTableSortState>({
    key: "code",
    direction: "none",
  })
  const [tooltipOpenKey, setTooltipOpenKey] = useState<ProgramSortKey | null>(null)
  const [internalExpandedBudgetUnits, setInternalExpandedBudgetUnits] = useState<
    Record<string, boolean>
  >({})
  const [internalExpandedProgramGroups, setInternalExpandedProgramGroups] = useState<
    Record<string, boolean>
  >({})
  const [internalExpandedPrograms, setInternalExpandedPrograms] = useState<
    Record<string, boolean>
  >({})

  const expandedBudgetUnits = externalExpandedBudgetUnits ?? internalExpandedBudgetUnits
  const setExpandedBudgetUnits =
    setExternalExpandedBudgetUnits ?? setInternalExpandedBudgetUnits

  const expandedProgramGroups = externalExpandedProgramGroups ?? internalExpandedProgramGroups
  const setExpandedProgramGroups =
    setExternalExpandedProgramGroups ?? setInternalExpandedProgramGroups

  const expandedPrograms = externalExpandedPrograms ?? internalExpandedPrograms
  const setExpandedPrograms = setExternalExpandedPrograms ?? setInternalExpandedPrograms
  const [budgetProgramsByBudgetUnitId, setBudgetProgramsByBudgetUnitId] = useState<
    Record<string, ProgramRow[]>
  >({})
  const budgetProgramsByBudgetUnitIdRef = useRef(budgetProgramsByBudgetUnitId)
  budgetProgramsByBudgetUnitIdRef.current = budgetProgramsByBudgetUnitId

  const [, setBudgetProgramsLoading] = useState<Record<string, boolean>>({})
  const [subProgramLoadingProgramId, setSubProgramLoadingProgramId] = useState<string | null>(null)
  const budgetProgramsInFlightRef = useRef(new Set<string>())

  const mergedRows = useMemo(() => {
    const children = Object.values(budgetProgramsByBudgetUnitId).flat()
    return [...rows, ...children]
  }, [budgetProgramsByBudgetUnitId, rows])

  const hierarchyRows = useMemo<DisplayHierarchyRow[]>(() => {
    const applyUpdatedRow = (row: ProgramRow): ProgramRow => {
      if (
        lastUpdatedRow &&
        row.id === lastUpdatedRow.id &&
        row.hierarchyLevel === lastUpdatedRow.hierarchyLevel
      ) {
        const merged = { ...row, ...lastUpdatedRow }
        return {
          ...merged,
          // API tree `parentId` is null for level-1 programs; table uses BU id — never drop it.
          parentId: merged.parentId ?? row.parentId,
          tab: merged.tab ?? row.tab,
        }
      }
      return row
    }

    const sortByKey = (left: ProgramRow, right: ProgramRow) => {
      const leftValue = sortState.key === "code" ? left.code : left.name
      const rightValue = sortState.key === "code" ? right.code : right.name
      const compare = leftValue.localeCompare(rightValue, undefined, {
        numeric: true,
        sensitivity: "base",
      })
      return sortState.direction === "asc" ? compare : -compare
    }

    const budgetUnitSource = mergedRows.filter((row) => row.hierarchyLevel === 0)
    const budgetUnits =
      sortState.direction === "none"
        ? budgetUnitSource
        : [...budgetUnitSource].sort(sortByKey)
    const programs = mergedRows.filter((row) => row.hierarchyLevel === 1)
    const subPrograms = mergedRows.filter((row) => row.hierarchyLevel === 2)

    const flattened: DisplayHierarchyRow[] = []
    for (const budgetUnit of budgetUnits) {
      const effectiveBudgetUnit = applyUpdatedRow(budgetUnit)
      flattened.push({ kind: "data", row: effectiveBudgetUnit })
      if (!expandedBudgetUnits[budgetUnit.id]) continue

      flattened.push({
        kind: "group",
        budgetUnitId: budgetUnit.id,
        label: "BU Program",
        hierarchyLevel: 1,
      })
      if (!expandedProgramGroups[budgetUnit.id]) continue

      const linkedProgramSource = programs.filter((program) => program.parentId === budgetUnit.id)
      const linkedPrograms =
        sortState.direction === "none"
          ? linkedProgramSource
          : [...linkedProgramSource].sort(sortByKey)

      for (const program of linkedPrograms) {
        const effectiveProgram = applyUpdatedRow(program)
        flattened.push({ kind: "data", row: { ...effectiveProgram, hierarchyLevel: 2 } })
        if (!expandedPrograms[program.id]) continue

        // When a BU Program row is expanded, show only its own sub-programs,
        // matched by parentId coming from the backend response.
        const linkedSubProgramSource = subPrograms.filter(
          (subProgram) => subProgram.parentId === program.id
        )
        const linkedSubPrograms =
          sortState.direction === "none"
            ? linkedSubProgramSource
            : [...linkedSubProgramSource].sort(sortByKey)
        for (const subProgram of linkedSubPrograms) {
          const effectiveSub = applyUpdatedRow(subProgram)
          flattened.push({
            kind: "data",
            row: { 
              ...effectiveSub, 
              hierarchyLevel: 3,
              parentProgramName: program.name,
              parentProgramCode: program.code,
            },
          })
        }
      }
    }
    return flattened
  }, [expandedBudgetUnits, expandedProgramGroups, expandedPrograms, mergedRows, sortState, lastUpdatedRow])

  const handleSort = (key: ProgramSortKey) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
      if (prev.direction === "desc") return { key, direction: "none" }
      return { key, direction: "asc" }
    })
  }

  function patchBudgetProgramRow(updatedRow: ProgramRow) {
    setBudgetProgramsByBudgetUnitId((prev) => {
      let foundBucket: string | null = null
      for (const buId of Object.keys(prev)) {
        if (prev[buId].some((r) => r.id === updatedRow.id)) {
          foundBucket = buId
          break
        }
      }
      if (foundBucket) {
        return {
          ...prev,
          [foundBucket]: prev[foundBucket].map((r) =>
            r.id === updatedRow.id
              ? {
                  ...r,
                  ...updatedRow,
                  parentId: updatedRow.parentId ?? r.parentId,
                  tab: updatedRow.tab ?? r.tab,
                }
              : r,
          ),
        }
      }
      if (updatedRow.hierarchyLevel === 1 && updatedRow.parentId) {
        const buId = updatedRow.parentId
        return {
          ...prev,
          [buId]: [...(prev[buId] ?? []), { ...updatedRow, hierarchyLevel: 1 }],
        }
      }
      if (updatedRow.hierarchyLevel === 2 && updatedRow.parentId) {
        for (const [buId, rowList] of Object.entries(prev)) {
          if (rowList.some((r) => r.id === updatedRow.parentId && r.hierarchyLevel === 1)) {
            return {
              ...prev,
              [buId]: [...rowList, { ...updatedRow, hierarchyLevel: 2 }],
            }
          }
        }
      }
      return prev
    })
  }

  /** Load BU programs once per BU; use `refreshBudgetUnitPrograms` to force reload from API. */
  const ensureBudgetProgramsLoaded = async (
    budgetUnitId: string,
    options?: { force?: boolean },
  ) => {
    if (!options?.force) {
      const cached = budgetProgramsByBudgetUnitIdRef.current[budgetUnitId]
      if (cached?.some((r) => r.hierarchyLevel === 1)) return
    }
    if (options?.force) {
      budgetProgramsInFlightRef.current.delete(budgetUnitId)
    }
    if (budgetProgramsInFlightRef.current.has(budgetUnitId)) return

    budgetProgramsInFlightRef.current.add(budgetUnitId)

    setBudgetProgramsLoading((prev) => ({ ...prev, [budgetUnitId]: true }))
    try {
      const search = new URLSearchParams()
      search.set("page", "1")
      search.set("limit", "100")
      search.set("sort", "ASC")
      search.set("status", BudgetProgramStatusEnum.ACTIVE)
      search.set("type", BudgetProgramTypeEnum.PROGRAM)
      search.set("budgetUnitId", budgetUnitId)

      const raw = await api.get<any>(`/budgetprograms?${search.toString()}`)
      const payload = raw?.data ?? raw
      const list = Array.isArray(payload?.data) ? payload.data : []

      const mapped: ProgramRow[] = list.map((bp: any) => ({
        id: String(bp?.id ?? ""),
        tab: "Budget Units",
        code: String(bp?.code ?? ""),
        name: String(bp?.name ?? ""),
        medicalPct: bp?.medicalpercent == null ? "0.00" : String(bp.medicalpercent),
        description: bp?.description == null ? "" : String(bp.description),
        department: String(bp?.department?.name ?? ""),
        active: String(bp?.status ?? "").toLowerCase() === "active",
        hierarchyLevel: 1,
        type: bp?.type ?? BudgetProgramTypeEnum.PROGRAM,
        parentId: budgetUnitId,
        parentBudgetUnitName: String(bp?.budgetUnit?.name ?? ""),
      }))

      setBudgetProgramsByBudgetUnitId((prev) => {
        const existing = prev[budgetUnitId] ?? []
        const programIds = new Set(mapped.map((p) => p.id))
        const preservedSubs = existing.filter(
          (r) => r.hierarchyLevel === 2 && r.parentId != null && programIds.has(String(r.parentId)),
        )
        return { ...prev, [budgetUnitId]: [...mapped, ...preservedSubs] }
      })
    } finally {
      setBudgetProgramsLoading((prev) => ({ ...prev, [budgetUnitId]: false }))
      budgetProgramsInFlightRef.current.delete(budgetUnitId)
    }
  }

  const ensureBudgetProgramsLoadedRef = useRef(ensureBudgetProgramsLoaded)
  ensureBudgetProgramsLoadedRef.current = ensureBudgetProgramsLoaded

  useImperativeHandle(
    ref,
    () => ({
      patchBudgetProgramRow,
      refreshBudgetUnitPrograms: (budgetUnitId: string) =>
        ensureBudgetProgramsLoadedRef.current(budgetUnitId, { force: true }),
    }),
    [],
  )

  /** Refetch sub-programs for the BU whenever a BU Program row is expanded (not only the first time). */
  const ensureBudgetSubProgramsLoaded = async (budgetUnitId: string, programId: string) => {
    const inFlightKey = `${budgetUnitId}:subprograms`
    if (budgetProgramsInFlightRef.current.has(inFlightKey)) return

    budgetProgramsInFlightRef.current.add(inFlightKey)
    setBudgetProgramsLoading((prev) => ({ ...prev, [budgetUnitId]: true }))
    setSubProgramLoadingProgramId(programId)

    try {
      const search = new URLSearchParams()
      search.set("page", "1")
      search.set("limit", "100")
      search.set("sort", "ASC")
      search.set("status", BudgetProgramStatusEnum.ACTIVE)
      search.set("type", BudgetProgramTypeEnum.SUBPROGRAM)
      search.set("budgetUnitId", budgetUnitId)

      const raw = await api.get<any>(`/budgetprograms?${search.toString()}`)
      const payload = raw?.data ?? raw
      const list = Array.isArray(payload?.data) ? payload.data : []

      const mapped: ProgramRow[] = list.map((bp: any) => ({
        id: String(bp?.id ?? ""),
        tab: "Budget Units",
        code: String(bp?.code ?? ""),
        name: String(bp?.name ?? ""),
        medicalPct: bp?.medicalpercent == null ? "0.00" : String(bp.medicalpercent),
        description: bp?.description == null ? "" : String(bp.description),
        department: String(bp?.department?.name ?? ""),
        active: String(bp?.status ?? "").toLowerCase() === "active",
        hierarchyLevel: 2,
        type: bp?.type ?? BudgetProgramTypeEnum.SUBPROGRAM,
        parentId: String(bp?.parentId ?? "") || budgetUnitId,
        parentBudgetUnitName: String(bp?.budgetUnit?.name ?? ""),
      }))

      setBudgetProgramsByBudgetUnitId((prev) => {
        const base = prev[budgetUnitId] ?? []
        const withoutSub = base.filter((row) => row.hierarchyLevel !== 2)
        return {
          ...prev,
          [budgetUnitId]: [...withoutSub, ...mapped],
        }
      })
    } finally {
      setBudgetProgramsLoading((prev) => ({ ...prev, [budgetUnitId]: false }))
      setSubProgramLoadingProgramId((prev) => (prev === programId ? null : prev))
      budgetProgramsInFlightRef.current.delete(inFlightKey)
    }
  }

  const toggleBudgetUnit = (budgetUnitId: string) => {
    setExpandedBudgetUnits((prev) => {
      const nextExpanded = !prev[budgetUnitId]
      return {
        ...prev,
        [budgetUnitId]: nextExpanded,
      }
    })
  }

  const toggleProgramGroup = (budgetUnitId: string) => {
    setExpandedProgramGroups((prev) => {
      const nextExpanded = !prev[budgetUnitId]
      if (nextExpanded) {
        // When expanding the "BU Program" group, lazy-load BU Programs (type=program)
        void ensureBudgetProgramsLoaded(budgetUnitId)
      }
      return {
        ...prev,
        [budgetUnitId]: nextExpanded,
      }
    })
  }

  const toggleProgram = (budgetUnitId: string, programId: string) => {
    setExpandedPrograms((prev) => {
      const nextExpanded = !prev[programId]
      if (nextExpanded) {
        // When expanding a specific BU Program row (e.g. >11111), lazy-load its sub-programs (type=subprogram)
        void ensureBudgetSubProgramsLoaded(budgetUnitId, programId)
      }
      return {
        ...prev,
        [programId]: nextExpanded,
      }
    })
  }

  const getTooltipText = (key: ProgramSortKey) => {
    const isActive = sortState.key === key
    if (!isActive || sortState.direction === "none") return "Click to sort ascending"
    if (sortState.direction === "asc") return "Click to sort descending"
    return "Click to cancel sorting"
  }

  const skeletonRows = Array.from({ length: 8 }, (_, index) => `program-skeleton-${index}`)

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#e6e7ef]">
      <div className="flex">
        <div className="min-w-0 flex-1">
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "140px" }} />
              <col style={{ width: "210px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "190px" }} />
              <col style={{ width: "70px" }} />
              {!readonly && <col style={{ width: "70px" }} />}
            </colgroup>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
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
                          <span>BU Code</span>
                          <span className="pointer-events-none absolute right-[0px] inline-flex flex-col items-center leading-none">
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
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
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
                          <span>BU Name</span>
                          <span className="pointer-events-none absolute right-[0px] inline-flex flex-col items-center leading-none">
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
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-center text-[12px] font-medium text-white">
                  Medical Pct
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
                  Description
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
                  Department
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-center text-[12px] font-medium text-white">
                  Active
                </TableHead>
                {!readonly && (
                  <TableHead className="h-10 border-r-0 bg-[var(--primary)] px-3 text-center text-[12px] font-medium text-white">
                    Action
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
      </div>
      <div className="program-table-scroll [scrollbar-gutter:stable]">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "140px" }} />
            <col style={{ width: "210px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "170px" }} />
            <col style={{ width: "190px" }} />
            <col style={{ width: "70px" }} />
            {!readonly && <col style={{ width: "70px" }} />}
          </colgroup>
          <TableBody>
            {isLoading
              ? skeletonRows.map((rowId) => (
                  <TableRow key={rowId} className="h-10 border-b border-[#eff0f5] hover:bg-transparent">
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[70%]" /></TableCell>
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[80%]" /></TableCell>
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="mx-auto h-3.5 w-10" /></TableCell>
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[80%]" /></TableCell>
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="h-3.5 w-[70%]" /></TableCell>
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="mx-auto h-4 w-4 rounded-sm" /></TableCell>
                    {!readonly && (
                      <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="mx-auto h-3.5 w-3.5 rounded-sm" /></TableCell>
                    )}
                  </TableRow>
                ))
              : hierarchyRows.map((displayRow) => (
                  <>
                  <TableRow
                    key={displayRow.kind === "group" ? `group-${displayRow.budgetUnitId}` : displayRow.row.id}
                    className={`min-h-[40px] border-b border-[#eff0f5] hover:bg-transparent ${
                      displayRow.kind === "group" ||
                      displayRow.row.hierarchyLevel === 0 ||
                      displayRow.row.hierarchyLevel === 2
                        ? "cursor-pointer"
                        : ""
                    }`}
                    onClick={() => {
                      if (displayRow.kind === "group") {
                        toggleProgramGroup(displayRow.budgetUnitId)
                        return
                      }
                      if (displayRow.row.hierarchyLevel === 0) {
                        toggleBudgetUnit(displayRow.row.id)
                        return
                      }
                      if (displayRow.row.hierarchyLevel === 2) {
                        toggleProgram(displayRow.row.parentId ?? "", displayRow.row.id)
                      }
                    }}
                  >
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[140px]">
                      {displayRow.kind === "group" ? (
                        <div className="flex items-center gap-1" style={{ paddingLeft: `${displayRow.hierarchyLevel * 14}px` }}>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              toggleProgramGroup(displayRow.budgetUnitId)
                            }}
                            className="inline-flex cursor-pointer items-center text-[var(--primary)]"
                            aria-label="Toggle program group"
                          >
                            {expandedProgramGroups[displayRow.budgetUnitId] ? <ChevronUp className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                          </button>
                          <span className="text-[12px] font-medium text-[var(--primary)]">{displayRow.label}</span>
                        </div>
                      ) : (
                        <div
                          className="flex items-center gap-1"
                          style={{ paddingLeft: displayRow.row.hierarchyLevel ? `${displayRow.row.hierarchyLevel * 14}px` : "0px" }}
                        >
                          {displayRow.row.hierarchyLevel === 0 ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleBudgetUnit(displayRow.row.id)
                              }}
                              className="inline-flex cursor-pointer items-center text-[var(--primary)]"
                              aria-label="Toggle budget unit children"
                            >
                              {expandedBudgetUnits[displayRow.row.id] ? <ChevronUp className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            </button>
                          ) : null}
                          {displayRow.row.hierarchyLevel === 2 ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleProgram(displayRow.row.parentId ?? "", displayRow.row.id)
                              }}
                              className="inline-flex cursor-pointer items-center text-[var(--primary)]"
                              aria-label="Toggle program children"
                            >
                              {expandedPrograms[displayRow.row.id] ? <ChevronUp className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            </button>
                          ) : null}
                          {displayRow.row.code}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[210px]">
                      {displayRow.kind === "group" ? "" : displayRow.row.name}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[150px]">
                      {displayRow.kind === "group" ? "" : displayRow.row.medicalPct}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[170px]">
                      {displayRow.kind === "group" ? "" : displayRow.row.description}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[190px]">
                      {displayRow.kind === "group" ? "" : displayRow.row.department}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      {displayRow.kind === "group" ? null : (
                        <img src={displayRow.row.active ? tableCheckIcon : tableCloseIcon} alt="" aria-hidden="true" className="mx-auto size-[12px] object-contain" />
                      )}
                    </TableCell>
                    {!readonly && (
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      {displayRow.kind === "group"
                        ? null
                        : displayRow.row.hierarchyLevel === 2
                          ? // BU Program row: show dropdown (Add + Edit)
                            (canAddBudgetProgram || canUpdateBudgetProgram) && (
                              <div className="flex justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      type="button"
                                      onClick={(event) => event.stopPropagation()}
                                      className="inline-flex cursor-pointer items-center justify-center text-[var(--primary)] opacity-90 transition-opacity hover:opacity-100"
                                      aria-label="Open row actions"
                                    >
                                      <EllipsisVertical className="size-[14px]" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="center"
                                    side="bottom"
                                    sideOffset={6}
                                    className="!w-[92px] !min-w-[92px] rounded-[6px] border border-[#edf0f6] p-1 shadow-[0_8px_20px_rgba(17,24,39,0.14)]"
                                  >
                                    {canAddBudgetProgram && (
                                      <DropdownMenuItem
                                        onClick={() => onAddSubProgramFromProgram?.(displayRow.row)}
                                        className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[12px] text-[#111827]"
                                      >
                                        <Plus className="size-[13px] text-[var(--primary)]" />
                                        Add
                                      </DropdownMenuItem>
                                    )}
                                    {canUpdateBudgetProgram && (
                                      <DropdownMenuItem
                                        onClick={() => onEditRow(displayRow.row)}
                                        className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[12px] text-[#111827]"
                                      >
                                        <Pencil className="size-[13px] text-[var(--primary)]" />
                                        Edit
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )
                          : // Sub-program and BU rows: simple Edit button only
                            canUpdateBudgetProgram && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  onEditRow(displayRow.row)
                                }}
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
                  {/* Removed group-level skeleton: loading is now shown only directly under the expanded BU Program row */}
                  {displayRow.kind === "data" &&
                    displayRow.row.hierarchyLevel === 2 &&
                    expandedPrograms[displayRow.row.id] &&
                    subProgramLoadingProgramId === displayRow.row.id && (
                      <TableRow
                        key={`loading-sub-${displayRow.row.id}`}
                        className="h-10 border-b border-[#eff0f5] hover:bg-transparent"
                      >
                        <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                          <Skeleton className="h-3.5 w-[70%]" />
                        </TableCell>
                        <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                          <Skeleton className="h-3.5 w-[80%]" />
                        </TableCell>
                        <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                          <Skeleton className="mx-auto h-3.5 w-10" />
                        </TableCell>
                        <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                          <Skeleton className="h-3.5 w-[80%]" />
                        </TableCell>
                        <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                          <Skeleton className="h-3.5 w-[70%]" />
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
                  </>
                ))}
            {!isLoading && hierarchyRows.length === 0 ? (
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
  )
})

BudgetUnitTable.displayName = "BudgetUnitTable"
