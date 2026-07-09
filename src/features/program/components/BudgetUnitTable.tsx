import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react"
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
import { BudgetProgramTypeEnum } from "../enums/enums"
import { usePermissions } from "@/hooks/usePermissions"

export const BudgetUnitTable = forwardRef<BudgetUnitTableHandle, BudgetUnitTableProps>(
  function BudgetUnitTable(
    {
      rows,
      isLoading,
      onEditRow,
      onAddSubProgramFromProgram,
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
  const [patchedRows, setPatchedRows] = useState<Record<string, ProgramRow>>({})
  const budgetProgramsByBudgetUnitIdRef = useRef(budgetProgramsByBudgetUnitId)
  budgetProgramsByBudgetUnitIdRef.current = budgetProgramsByBudgetUnitId

  const [budgetProgramsLoading, setBudgetProgramsLoading] = useState<Record<string, boolean>>({})
  const [subProgramLoadingProgramId, setSubProgramLoadingProgramId] = useState<string | null>(null)
  const budgetProgramsInFlightRef = useRef(new Set<string>())

  const mergedRows = useMemo(() => {
    const children = Object.values(budgetProgramsByBudgetUnitId).flat()
    return [...rows, ...children]
  }, [budgetProgramsByBudgetUnitId, rows])

  const hierarchyRows = useMemo<DisplayHierarchyRow[]>(() => {
    // Use the same level-prefixed key as React Fragment keys to avoid ID collision
    // e.g. BU 1140 id="1" and Program 401100 id="1" → "bu-1" vs "prog-1"
    const patchKey = (row: ProgramRow): string => {
      if (row.hierarchyLevel === 0) return `bu-${row.id}`
      if (row.hierarchyLevel === 1) return `prog-${row.id}`
      return `sub-${row.id}`
    }
    const applyUpdatedRow = (row: ProgramRow): ProgramRow => {
      const patched = patchedRows[patchKey(row)]
      if (patched) {
        return {
          ...row,
          ...patched,
          parentId: patched.parentId ?? row.parentId,
          tab: patched.tab ?? row.tab,
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
      if (expandedBudgetUnits[budgetUnit.id] !== true) continue

      flattened.push({
        kind: "group",
        budgetUnitId: budgetUnit.id,
        label: "BU Program",
        hierarchyLevel: 1,
      })
      if (expandedProgramGroups[budgetUnit.id] !== true) continue

      const linkedProgramSource = programs.filter((program) => program.parentId === budgetUnit.id)
      const linkedPrograms =
        sortState.direction === "none"
          ? linkedProgramSource
          : [...linkedProgramSource].sort(sortByKey)

      for (const program of linkedPrograms) {
        const effectiveProgram = applyUpdatedRow(program)
        flattened.push({
          kind: "data",
          row: {
            ...effectiveProgram,
            hierarchyLevel: 2,
            parentActive: effectiveBudgetUnit.active,
          },
        })
        // Use composite key buId:programId to avoid ID collision
        // (BU 1140 id="1" and Program 401100 id="1" are different entities)
        const programExpandKey = `${budgetUnit.id}:${program.id}`
        if (expandedPrograms[programExpandKey] !== true) continue

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
              parentActive: effectiveProgram.active,
            },
          })
        }
      }
    }
    return flattened
  }, [expandedBudgetUnits, expandedProgramGroups, expandedPrograms, mergedRows, sortState, patchedRows])

  const handleSort = (key: ProgramSortKey) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
      if (prev.direction === "desc") return { key, direction: "none" }
      return { key, direction: "asc" }
    })
  }

  function patchBudgetProgramRow(updatedRow: ProgramRow) {
    // Use same level-prefixed key to avoid collision between BU/Program/SubProgram with same numeric id
    let pKey: string
    if (updatedRow.hierarchyLevel === 0) pKey = `bu-${updatedRow.id}`
    else if (updatedRow.hierarchyLevel === 1) pKey = `prog-${updatedRow.id}`
    else pKey = `sub-${updatedRow.id}`
    setPatchedRows((prev) => ({ ...prev, [pKey]: updatedRow }))

   
    if (updatedRow.hierarchyLevel === 0) {
      const buId = updatedRow.id
      setBudgetProgramsByBudgetUnitId((prev) => {
        const updated = { ...prev }
        delete updated[buId]
        return updated
      })
      // Also clear patchedRows for any children of this BU to ensure fresh data on re-expand
      setPatchedRows((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((key) => {
          const row = next[key]
          if (row.parentId === buId) {
            delete next[key]
          }
        })
        return next
      })
      setExpandedBudgetUnits((prev) => ({ ...prev, [buId]: false }))
      setExpandedProgramGroups((prev) => ({ ...prev, [buId]: false }))
      setExpandedPrograms((prev) => {
        const next = { ...prev }
        for (const key of Object.keys(next)) {
          if (key.startsWith(`${buId}:`)) next[key] = false
        }
        return next
      })
      return
    }

    // If Level 1 (BU Program) updated, clear patchedRows for its sub-programs
    if (updatedRow.hierarchyLevel === 1 || updatedRow.hierarchyLevel === 2) {
      setPatchedRows((prev) => {
        const next = { ...prev }
        Object.keys(next).forEach((key) => {
          const row = next[key]
          // If this is a sub-program belonging to the updated BU Program
          if (row.hierarchyLevel === 2 && row.parentId === updatedRow.id) {
            delete next[key]
          }
        })
        return next
      })
    }

    setBudgetProgramsByBudgetUnitId((prev) => {
      let foundBucket: string | null = null
      for (const buId of Object.keys(prev)) {
       
        if (prev[buId].some((r) => r.id === updatedRow.id && r.hierarchyLevel === updatedRow.hierarchyLevel)) {
          foundBucket = buId
          break
        }
      }
      if (foundBucket) {
        return {
          ...prev,
          [foundBucket]: prev[foundBucket].map((r) =>
            r.id === updatedRow.id && r.hierarchyLevel === updatedRow.hierarchyLevel
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
    // Remove cache check to always fetch fresh data on expansion
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

      setPatchedRows((prev) => {
        const next = { ...prev }
        mapped.forEach((r) => {
          let pKey: string
          if (r.hierarchyLevel === 0) pKey = `bu-${r.id}`
          else if (r.hierarchyLevel === 1) pKey = `prog-${r.id}`
          else pKey = `sub-${r.id}`
          delete next[pKey]
        })
        return next
      })
    } finally {
      setBudgetProgramsLoading((prev) => ({ ...prev, [budgetUnitId]: false }))
      budgetProgramsInFlightRef.current.delete(budgetUnitId)
    }
  }

  const ensureBudgetProgramsLoadedRef = useRef(ensureBudgetProgramsLoaded)
  ensureBudgetProgramsLoadedRef.current = ensureBudgetProgramsLoaded

  // Always keep a ref to the latest patchBudgetProgramRow so useImperativeHandle
  // (which has empty deps []) never calls a stale closure that has the wrong setters.
  const patchBudgetProgramRowRef = useRef(patchBudgetProgramRow)
  patchBudgetProgramRowRef.current = patchBudgetProgramRow

  useImperativeHandle(
    ref,
    () => ({
      patchBudgetProgramRow: (updatedRow: ProgramRow) =>
        patchBudgetProgramRowRef.current(updatedRow),
      refreshBudgetUnitPrograms: (budgetUnitId: string) =>
        ensureBudgetProgramsLoadedRef.current(budgetUnitId, { force: true }),
      collapseRow: (rowId: string, parentId?: string) => {
        if (!parentId) {
          // Budget Unit update (Level 0): Collapse the BU and its groups
          setExpandedBudgetUnits((prev) => ({ ...prev, [rowId]: false }))
          setExpandedProgramGroups((prev) => ({ ...prev, [rowId]: false }))
          setBudgetProgramsByBudgetUnitId((prev) => {
            const next = { ...prev }
            delete next[rowId]
            return next
          })
          budgetProgramsInFlightRef.current.delete(rowId)
          budgetProgramsInFlightRef.current.delete(`${rowId}:subprograms`)
          setExpandedPrograms((prev) => {
            const next = { ...prev }
            for (const key of Object.keys(next)) {
              if (key.startsWith(`${rowId}:`)) next[key] = false
            }
            return next
          })
        } else {
          // Program update (Level 1): Collapse ONLY this program's children caret.
          // The "BU Program" group and the Budget Unit itself stay open.
          const expandKey = `${parentId}:${rowId}`
          setExpandedPrograms((prev) => ({ ...prev, [expandKey]: false }))

          // Granularly remove sub-programs of THIS program ONLY from BU cache
          setBudgetProgramsByBudgetUnitId((prev) => {
            const rows = prev[parentId]
            if (!rows) return prev
            return {
              ...prev,
              [parentId]: rows.filter((r) => !(r.hierarchyLevel === 2 && r.parentId === rowId)),
            }
          })
          budgetProgramsInFlightRef.current.delete(`${parentId}:subprograms`)
        }
      },
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

      setPatchedRows((prev) => {
        const next = { ...prev }
        mapped.forEach((r) => {
          let pKey: string
          if (r.hierarchyLevel === 0) pKey = `bu-${r.id}`
          else if (r.hierarchyLevel === 1) pKey = `prog-${r.id}`
          else pKey = `sub-${r.id}`
          delete next[pKey]
        })
        return next
      })
    } finally {
      setBudgetProgramsLoading((prev) => ({ ...prev, [budgetUnitId]: false }))
      setSubProgramLoadingProgramId((prev) => (prev === programId ? null : prev))
      budgetProgramsInFlightRef.current.delete(inFlightKey)
    }
  }

  const toggleBudgetUnit = (budgetUnitId: string) => {
    const nextExpanded = !(expandedBudgetUnits[budgetUnitId] === true)
    setBudgetProgramsByBudgetUnitId((prevB) => {
      const updated = { ...prevB }
      delete updated[budgetUnitId]
      return updated
    })
    budgetProgramsInFlightRef.current.delete(budgetUnitId)
    if (nextExpanded) {
      // Only expand the BU row itself; BU Program group stays collapsed until user clicks it
      setExpandedProgramGroups((prevG) => ({ ...prevG, [budgetUnitId]: false }))
      setExpandedPrograms((prevE) => {
        // Remove all composite keys for this BU: "budgetUnitId:*"
        const next: Record<string, boolean> = {}
        for (const key of Object.keys(prevE)) {
          if (!key.startsWith(`${budgetUnitId}:`)) next[key] = prevE[key]
        }
        return next
      })
      setExpandedBudgetUnits((prev) => ({ ...prev, [budgetUnitId]: true }))
      // Do NOT pre-fetch programs here — they are fetched when user opens BU Program group
    } else {
      setExpandedProgramGroups((prevG) => {
        const next = { ...prevG }
        delete next[budgetUnitId]
        return next
      })
      setExpandedPrograms((prevE) => {
        // Remove all composite keys for this BU: "budgetUnitId:*"
        const next: Record<string, boolean> = {}
        for (const key of Object.keys(prevE)) {
          if (!key.startsWith(`${budgetUnitId}:`)) next[key] = prevE[key]
        }
        return next
      })
      setExpandedBudgetUnits((prev) => ({ ...prev, [budgetUnitId]: false }))
    }
  }

  const toggleProgramGroup = (budgetUnitId: string) => {
    const nextExpanded = !(expandedProgramGroups[budgetUnitId] === true)
    if (nextExpanded) {
      setBudgetProgramsByBudgetUnitId((prevB) => {
        const updated = { ...prevB }
        delete updated[budgetUnitId]
        return updated
      })
      budgetProgramsInFlightRef.current.delete(budgetUnitId)
      setExpandedPrograms((prevE) => {
        const next: Record<string, boolean> = {}
        for (const key of Object.keys(prevE)) {
          if (!key.startsWith(`${budgetUnitId}:`)) next[key] = prevE[key]
        }
        return next
      })
      setExpandedProgramGroups((prev) => ({ ...prev, [budgetUnitId]: true }))
      void ensureBudgetProgramsLoaded(budgetUnitId)
    } else {
      setBudgetProgramsByBudgetUnitId((prevB) => {
        const updated = { ...prevB }
        delete updated[budgetUnitId]
        return updated
      })
      setExpandedPrograms((prevE) => {
        const next: Record<string, boolean> = {}
        for (const key of Object.keys(prevE)) {
          if (!key.startsWith(`${budgetUnitId}:`)) next[key] = prevE[key]
        }
        return next
      })
      setExpandedProgramGroups((prev) => ({ ...prev, [budgetUnitId]: false }))
    }
  }

  const toggleProgram = (budgetUnitId: string, programId: string) => {
    // Use composite key to avoid ID collision (e.g. BU id=1 and Program id=1)
    const expandKey = `${budgetUnitId}:${programId}`
    const nextExpanded = !(expandedPrograms[expandKey] === true)
    if (nextExpanded) {
      const inFlightKey = `${budgetUnitId}:subprograms`
      budgetProgramsInFlightRef.current.delete(inFlightKey)
      setExpandedPrograms((prev) => ({ ...prev, [expandKey]: true }))
      void ensureBudgetSubProgramsLoaded(budgetUnitId, programId)
    } else {
      setBudgetProgramsByBudgetUnitId((prevB) => {
        const existing = prevB[budgetUnitId]
        if (!existing) return prevB
        return {
          ...prevB,
          [budgetUnitId]: existing.filter(
            (r) => !(r.hierarchyLevel === 2 && r.parentId === programId)
          ),
        }
      })
      setExpandedPrograms((prev) => ({ ...prev, [expandKey]: false }))
    }
  }

  const getTooltipText = (key: ProgramSortKey) => {
    const isActive = sortState.key === key
    if (!isActive || sortState.direction === "none") return "Click to sort ascending"
    if (sortState.direction === "asc") return "Click to sort descending"
    return "Click to cancel sorting"
  }

  const skeletonRows = Array.from({ length: 8 }, (_, index) => `program-skeleton-${index}`)

  interface BuNode {
    buRow: ProgramRow;
    groupExpanded: boolean;
    groupLabel?: string;
    programs: ProgramNode[];
  }

  interface ProgramNode {
    programRow: ProgramRow;
    subPrograms: ProgramRow[];
  }

  const buCards = useMemo(() => {
    const cards: BuNode[] = [];
    let currentBu: BuNode | null = null;
    let currentProgram: ProgramNode | null = null;

    for (const item of hierarchyRows) {
      if (item.kind === "data") {
        if (item.row.hierarchyLevel === 0) {
          currentBu = {
            buRow: item.row,
            groupExpanded: false,
            programs: [],
          };
          cards.push(currentBu);
          currentProgram = null;
        } else if (item.row.hierarchyLevel === 2) {
          if (currentBu) {
            currentProgram = {
              programRow: item.row,
              subPrograms: [],
            };
            currentBu.programs.push(currentProgram);
          }
        } else if (item.row.hierarchyLevel === 3) {
          if (currentProgram) {
            currentProgram.subPrograms.push(item.row);
          }
        }
      } else if (item.kind === "group") {
        if (currentBu && item.budgetUnitId === currentBu.buRow.id) {
          currentBu.groupExpanded = true;
          currentBu.groupLabel = item.label;
        }
      }
    }
    return cards;
  }, [hierarchyRows]);

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
        ) : buCards.length === 0 ? (
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
          buCards.map((buCard) => (
            <div
              key={`bu-card-${buCard.buRow.id}`}
              className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden flex flex-col hover:border-[#6C5DD3]/40 transition-colors"
            >
              {/* Parent BU Header */}
              <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-2.5 gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleBudgetUnit(buCard.buRow.id)
                    }}
                    className="text-white hover:bg-white/10 p-0.5 rounded shrink-0"
                    aria-label="Toggle budget unit children"
                  >
                    {expandedBudgetUnits[buCard.buRow.id] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  </button>
                  <span className="text-[13px] font-bold text-white shrink-0">
                    {buCard.buRow.code}
                  </span>
                  <span className="text-[12px] text-white/80 truncate">
                    - {buCard.buRow.name}
                  </span>
                </div>
                {!readonly && canUpdateBudgetProgram && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onEditRow(buCard.buRow)
                    }}
                    className="inline-flex size-6 cursor-pointer items-center justify-center rounded-[6px] bg-white/20 text-white hover:bg-white/30 shrink-0"
                    aria-label="Edit row"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Parent BU Body */}
              <div className="p-4 bg-white text-[12.5px] text-gray-700 space-y-2.5">
                <div className="flex justify-between items-baseline gap-x-2 border-b border-gray-50 pb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">Medical Pct:</span>
                  <span className="font-medium text-gray-600">{buCard.buRow.medicalPct}</span>
                </div>
                <div className="flex justify-between items-baseline gap-x-2 border-b border-gray-50 pb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">Description:</span>
                  <span className="font-normal text-gray-600 text-right break-words min-w-0 max-w-[70%]">{buCard.buRow.description || "—"}</span>
                </div>
                <div className="flex justify-between items-baseline gap-x-2 border-b border-gray-50 pb-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">Department:</span>
                  <span className="font-normal text-gray-600 text-right break-words min-w-0 max-w-[70%]">{buCard.buRow.department || "—"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">Active:</span>
                  <img
                    src={buCard.buRow.active ? tableCheckIcon : tableCloseIcon}
                    alt=""
                    className="size-3.5 object-contain"
                  />
                </div>

                {/* Nested Children Inside Parent Card */}
                {expandedBudgetUnits[buCard.buRow.id] && (
                  <div className="mt-4 pt-3 border-t border-gray-100 space-y-3">
                    {/* BU Program Group Toggle Header */}
                    <div
                      className="flex items-center justify-between py-2 px-3 bg-[#f8fafc] border border-dashed border-[#e2e8f0] rounded-[8px] cursor-pointer"
                      onClick={() => toggleProgramGroup(buCard.buRow.id)}
                    >
                      <span className="text-[12px] font-semibold text-(--primary)">BU Program</span>
                      {expandedProgramGroups[buCard.buRow.id] ? (
                        <ChevronDown className="size-4 text-(--primary)" />
                      ) : (
                        <ChevronRight className="size-4 text-(--primary)" />
                      )}
                    </div>

                    {/* Program List */}
                    {expandedProgramGroups[buCard.buRow.id] && (
                      <div className="space-y-3 pl-2.5 border-l border-dashed border-gray-200 mt-2">
                        {budgetProgramsLoading[buCard.buRow.id] && buCard.programs.length === 0 ? (
                          <div className="p-3 space-y-2">
                            <Skeleton className="h-3 w-[50%]" />
                            <Skeleton className="h-3 w-[70%]" />
                          </div>
                        ) : buCard.programs.length === 0 ? (
                          <div className="text-center py-2 text-[11.5px] text-gray-400">No programs loaded.</div>
                        ) : (
                          buCard.programs.map((progNode) => {
                            const programExpandKey = `${buCard.buRow.id}:${progNode.programRow.id}`
                            return (
                              <div
                                key={`nested-prog-${progNode.programRow.id}`}
                                className="rounded-[8px] border border-gray-100 bg-[#fbfbfe] overflow-hidden flex flex-col shadow-xs"
                              >
                                {/* Program Header */}
                                <div className="flex items-center justify-between bg-[#6C5DD3]/10 px-3 py-1.5 gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        toggleProgram(buCard.buRow.id, progNode.programRow.id)
                                      }}
                                      className="text-(--primary) hover:bg-(--primary)/5 p-0.5 rounded shrink-0"
                                      aria-label="Toggle program children"
                                    >
                                      {expandedPrograms[programExpandKey] ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                                    </button>
                                    <span className="text-[12px] font-bold text-(--primary) shrink-0">
                                      {progNode.programRow.code}
                                    </span>
                                    <span className="text-[11.5px] text-gray-700 truncate">
                                      - {progNode.programRow.name}
                                    </span>
                                  </div>
                                  {!readonly && (canAddBudgetProgram || canUpdateBudgetProgram) && (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button
                                          type="button"
                                          onClick={(event) => event.stopPropagation()}
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
                                        {canAddBudgetProgram && progNode.programRow.active && (
                                          <DropdownMenuItem
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              onAddSubProgramFromProgram?.(progNode.programRow)
                                            }}
                                            className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[11.5px] text-[#111827]"
                                          >
                                            <Plus className="size-[12px] text-(--primary)" />
                                            Add
                                          </DropdownMenuItem>
                                        )}
                                        {canUpdateBudgetProgram && (
                                          <DropdownMenuItem
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              onEditRow(progNode.programRow)
                                            }}
                                            className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[11.5px] text-[#111827]"
                                          >
                                            <Pencil className="size-[12px] text-(--primary)" />
                                            Edit
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  )}
                                </div>

                                {/* Program Body */}
                                <div className="p-3 space-y-2 text-[11.5px] text-gray-600 bg-white/50">
                                  <div className="flex justify-between items-baseline border-b border-gray-50/50 pb-1">
                                    <span className="font-semibold text-gray-500">Medical Pct:</span>
                                    <span>{progNode.programRow.medicalPct}</span>
                                  </div>
                                  <div className="flex justify-between items-baseline border-b border-gray-50/50 pb-1">
                                    <span className="font-semibold text-gray-500">Description:</span>
                                    <span className="text-right max-w-[70%] truncate">{progNode.programRow.description || "—"}</span>
                                  </div>
                                  <div className="flex justify-between items-baseline border-b border-gray-50/50 pb-1">
                                    <span className="font-semibold text-gray-500">Department:</span>
                                    <span className="text-right max-w-[70%] truncate">{progNode.programRow.department || "—"}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="font-semibold text-gray-500">Active:</span>
                                    <img
                                      src={progNode.programRow.active ? tableCheckIcon : tableCloseIcon}
                                      alt=""
                                      className="size-3 object-contain"
                                    />
                                  </div>

                                  {/* Sub-Programs Nested Inside Program */}
                                  {expandedPrograms[programExpandKey] && (
                                    <div className="mt-2.5 pt-2 border-t border-gray-100/50 space-y-2">
                                      <div className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Sub-Programs</div>
                                      <div className="space-y-2 pl-2 border-l border-gray-100">
                                        {progNode.subPrograms.map((subProg) => (
                                          <div
                                            key={`nested-sub-${subProg.id}`}
                                            className="p-2 rounded-[6px] border border-gray-50 bg-gray-50/40 flex flex-col gap-1.5"
                                          >
                                            {/* Sub-Program Header */}
                                            <div className="flex justify-between items-center gap-1.5">
                                              <span className="text-[11.5px] font-bold text-gray-700 truncate">
                                                {subProg.code} - {subProg.name}
                                              </span>
                                              {!readonly && canUpdateBudgetProgram && (
                                                <button
                                                  type="button"
                                                  onClick={(event) => {
                                                    event.stopPropagation()
                                                    onEditRow(subProg)
                                                  }}
                                                  className="text-gray-400 hover:text-(--primary) p-0.5 rounded"
                                                  aria-label="Edit sub-program"
                                                >
                                                  <Pencil className="size-3" />
                                                </button>
                                              )}
                                            </div>
                                            {/* Sub-Program Fields */}
                                            <div className="grid grid-cols-2 gap-x-2 text-[10.5px] text-gray-500">
                                              <div>Medical Pct: {subProg.medicalPct}</div>
                                              <div>Active: {subProg.active ? "Yes" : "No"}</div>
                                              <div className="col-span-2 truncate">Desc: {subProg.description || "—"}</div>
                                            </div>
                                          </div>
                                        ))}

                                        {subProgramLoadingProgramId === progNode.programRow.id && (
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
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden xl:block overflow-hidden rounded-[4px] border border-[#e6e7ef]">
        <div className="overflow-x-auto">
        <div className="program-table-scroll [scrollbar-gutter:stable]">
          <Table className="table-fixed min-w-[1000px]">
            <colgroup>
              <col style={{ width: "140px" }} />
              <col style={{ width: "210px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "190px" }} />
              <col style={{ width: "70px" }} />
              {!readonly && <col style={{ width: "70px" }} />}
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
                          <span>BU Code</span>
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
                          <span>BU Name</span>
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
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                  Medical Pct
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-[12px] font-medium text-white">
                  Description
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-(--primary) px-3 text-[12px] font-medium text-white">
                  Department
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
                    <React.Fragment key={
                      displayRow.kind === "group"
                        ? `group-${displayRow.budgetUnitId}`
                        : displayRow.row.hierarchyLevel === 0
                          ? `bu-${displayRow.row.id}`
                          : displayRow.row.hierarchyLevel === 1
                            ? `prog-${displayRow.row.id}`
                            : `sub-${displayRow.row.id}`
                    }>
                    <TableRow
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
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[140px]">
                        {displayRow.kind === "group" ? (
                          <div className="flex items-center gap-1" style={{ paddingLeft: `${displayRow.hierarchyLevel * 14}px` }}>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleProgramGroup(displayRow.budgetUnitId)
                              }}
                              className="inline-flex cursor-pointer items-center text-(--primary)"
                              aria-label="Toggle program group"
                            >
                              {expandedProgramGroups[displayRow.budgetUnitId] ? <ChevronUp className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                            </button>
                            <span className="text-[12px] font-medium text-(--primary)">{displayRow.label}</span>
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
                                className="inline-flex cursor-pointer items-center text-(--primary)"
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
                                className="inline-flex cursor-pointer items-center text-(--primary)"
                                aria-label="Toggle program children"
                              >
                                {expandedPrograms[`${displayRow.row.parentId ?? ""}:${displayRow.row.id}`] ? <ChevronUp className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                              </button>
                            ) : null}
                            {displayRow.row.code}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[210px]">
                        {displayRow.kind === "group" ? "" : displayRow.row.name}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[150px]">
                        {displayRow.kind === "group" ? "" : displayRow.row.medicalPct}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[170px]">
                        {displayRow.kind === "group" ? "" : displayRow.row.description}
                      </TableCell>
                      <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all wrap-anywhere max-w-[190px]">
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
                                      {canAddBudgetProgram && displayRow.row.active && (
                                        <DropdownMenuItem
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            onAddSubProgramFromProgram?.(displayRow.row)
                                          }}
                                          className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[12px] text-[#111827]"
                                        >
                                          <Plus className="size-[13px] text-(--primary)" />
                                          Add
                                        </DropdownMenuItem>
                                      )}
                                      {canUpdateBudgetProgram && (
                                        <DropdownMenuItem
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            onEditRow(displayRow.row)
                                          }}
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
                    </React.Fragment>
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
    </div>
  </>
  )
})

BudgetUnitTable.displayName = "BudgetUnitTable"
