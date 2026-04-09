import { useMemo, useRef, useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react"

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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  ProgramRow,
  ProgramSortKey,
  ProgramTableSortState,
  TimeStudyProgramTableProps,
  TimeStudyProgramResDto,
} from "../types"
import { usePermissions } from "@/hooks/usePermissions"

export function TimeStudyProgramTable({
  rows,
  isLoading,
  onEditRow,
  lastUpdatedRow,
}: TimeStudyProgramTableProps) {
  const { canUpdate } = usePermissions()
  const canUpdateTsProgram = canUpdate("timestudyprogram")

  const [sortState, setSortState] = useState<ProgramTableSortState>({
    key: "code",
    direction: "none",
  })
  const [tooltipOpenKey, setTooltipOpenKey] = useState<ProgramSortKey | null>(null)
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({})
  const [childrenByParentId, setChildrenByParentId] = useState<Record<string, ProgramRow[]>>({})
  const [childrenLoading, setChildrenLoading] = useState<Record<string, boolean>>({})
  const childrenInFlightRef = useRef(new Set<string>())

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

      const allChildren = childrenByParentId[primary.id] ?? []
      const secondaries = allChildren.filter((c) => c.hierarchyLevel === 1)
      const subprograms = allChildren.filter((c) => c.hierarchyLevel === 2)

      const renderedSubIds = new Set<string>()

      for (const sec of secondaries) {
        const effectiveSecondary = applyUpdatedRow(sec)
        flattened.push(effectiveSecondary)
        // sub.parentId from backend = the secondary's numeric id
        const subs = subprograms.filter((sub) => sub.parentId === sec.id)
        for (const sub of subs) {
          const effectiveSub = applyUpdatedRow(sub)
          flattened.push(effectiveSub)
          renderedSubIds.add(sub.id)
        }
      }

      // Any subprograms whose parentId didn't match a secondary (e.g. parentId = primaryId as fallback)
      const orphanSubs = subprograms.filter((sub) => !renderedSubIds.has(sub.id))
      flattened.push(...orphanSubs.map(applyUpdatedRow))
    }
    return flattened
  }, [expandedPrograms, sortedPrograms, childrenByParentId, lastUpdatedRow])

  const mapTimeStudyChildToRow = (
    raw: TimeStudyProgramResDto,
    hierarchyLevel: 1 | 2,
    fallbackParentId: string
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
      hierarchyLevel,
      parentId: raw.parentId ? String(raw.parentId) : fallbackParentId,
      type: hierarchyLevel === 1 ? "secondary" : "subprogram",
      timeStudyBudgetProgramId,
      costAllocation: raw.costAllocation === true,
      isMultiCode: raw.isMultiCode === true,
    }
  }

  /** Refetch secondary + sub-program rows whenever a primary TS Program row is expanded (not only the first time). */
  const ensureChildrenLoaded = async (primaryId: string) => {
    const primary = mergedRows.find((row) => row.id === primaryId)
    if (!primary?.timeStudyBudgetProgramId) return
    if (childrenInFlightRef.current.has(primaryId)) return

    childrenInFlightRef.current.add(primaryId)
    setChildrenLoading((prev) => ({ ...prev, [primaryId]: true }))
    try {
      const searchSec = new URLSearchParams()
      searchSec.set("page", "1")
      searchSec.set("limit", "100")
      searchSec.set("sort", "ASC")
      searchSec.set("status", "active")
      searchSec.set("type", "secondary")
      searchSec.set("budgetProgramId", primary.timeStudyBudgetProgramId)

      const searchSub = new URLSearchParams()
      searchSub.set("page", "1")
      searchSub.set("limit", "100")
      searchSub.set("sort", "ASC")
      searchSub.set("status", "active")
      searchSub.set("type", "subprogram")
      searchSub.set("budgetProgramId", primary.timeStudyBudgetProgramId)

      const [resSec, resSub] = await Promise.all([
        api.get<any>(`/timestudyprograms?${searchSec.toString()}`),
        api.get<any>(`/timestudyprograms?${searchSub.toString()}`)
      ])

      const payloadSec = resSec?.data ?? resSec
      const payloadSub = resSub?.data ?? resSub

      const listSec = Array.isArray(payloadSec?.data) ? payloadSec.data : []
      const listSub = Array.isArray(payloadSub?.data) ? payloadSub.data : []

      // Filter locally in case backend doesn't support budgetProgramId filtering
      const validSec = listSec.filter((item: any) => String(item.budgetProgram?.id) === primary.timeStudyBudgetProgramId)
      const validSub = listSub.filter((item: any) => String(item.budgetProgram?.id) === primary.timeStudyBudgetProgramId)

      const mappedSec: ProgramRow[] = validSec.map((item: any) => mapTimeStudyChildToRow(item, 1, primaryId))
      const mappedSub: ProgramRow[] = validSub.map((item: any) => mapTimeStudyChildToRow(item, 2, primaryId))

      const combined = [...mappedSec, ...mappedSub]
      combined.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))

      setChildrenByParentId((prev) => ({
        ...prev,
        [primaryId]: combined,
      }))
    } finally {
      childrenInFlightRef.current.delete(primaryId)
      setChildrenLoading((prev) => ({ ...prev, [primaryId]: false }))
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
      <div className="flex">
        <div className="min-w-0 flex-1">
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "140px" }} />
              <col style={{ width: "220px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "170px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "80px" }} />
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
                          <span>TS Code</span>
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
                          <span>TS Program</span>
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
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
                  BU Program
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
                  Department
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
                  MultiCodes
                </TableHead>
                <TableHead className="h-10 border-r border-white/50 bg-[var(--primary)] px-3 text-center text-[12px] font-medium text-white">
                  Active
                </TableHead>
                <TableHead className="h-10 border-r-0 bg-[var(--primary)] px-3 text-center text-[12px] font-medium text-white">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
      </div>
      <div className="program-table-scroll [scrollbar-gutter:stable]">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "140px" }} />
            <col style={{ width: "220px" }} />
            <col style={{ width: "170px" }} />
            <col style={{ width: "170px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "80px" }} />
            <col style={{ width: "80px" }} />
          </colgroup>
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
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="mx-auto h-3.5 w-3.5 rounded-sm" /></TableCell>
                  </TableRow>
                ))
              : displayRows.map((row) => (
                  <>
                  <TableRow key={row.id} className="min-h-[40px] border-b border-[#eff0f5] hover:bg-transparent">
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[140px]">
                      <div
                        className="flex items-center gap-1"
                        style={{
                          paddingLeft:
                            row.hierarchyLevel === 1 ? "14px" : row.hierarchyLevel === 2 ? "28px" : "0px",
                        }}
                      >
                        {row.hierarchyLevel === 0 ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setExpandedPrograms((prev) => {
                                const next = !prev[row.id]
                                if (next) {
                                  void ensureChildrenLoaded(row.id)
                                }
                                return { ...prev, [row.id]: next }
                              })
                            }}
                            className="inline-flex cursor-pointer items-center text-[var(--primary)]"
                            aria-label="Toggle TS secondary programs"
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
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[220px]">
                      {row.name}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[170px]">
                      {row.parentBudgetUnitName ?? ""}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] whitespace-pre-wrap break-all [overflow-wrap:anywhere] max-w-[170px]">
                      {row.department}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      <img src={row.isMultiCode ? tableCheckIcon : tableCloseIcon} alt="" aria-hidden="true" className="mx-auto size-[12px] object-contain" />
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      <img src={row.active ? tableCheckIcon : tableCloseIcon} alt="" aria-hidden="true" className="mx-auto size-[12px] object-contain" />
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      {canUpdateTsProgram && (
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
                  </TableRow>
                  {row.hierarchyLevel === 0 &&
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
                        <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                          <Skeleton className="mx-auto h-3.5 w-3.5 rounded-sm" />
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
            {!isLoading && displayRows.length === 0 ? (
              <TableRow className="h-[210px] hover:bg-transparent">
                <TableCell colSpan={7} className="text-center">
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
}

