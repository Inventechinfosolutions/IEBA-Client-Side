import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp, EllipsisVertical, Pencil, Plus } from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
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
  BudgetUnitTableProps,
  DisplayHierarchyRow,
  ProgramRow,
  ProgramSortKey,
  ProgramTableSortState,
} from "../types"

export function BudgetUnitTable({
  rows,
  isLoading,
  onEditRow,
  onAddSubProgramFromProgram,
}: BudgetUnitTableProps) {
  const [sortState, setSortState] = useState<ProgramTableSortState>({
    key: "code",
    direction: "asc",
  })
  const [tooltipOpenKey, setTooltipOpenKey] = useState<ProgramSortKey | null>(null)
  const [expandedBudgetUnits, setExpandedBudgetUnits] = useState<Record<string, boolean>>({})
  const [expandedProgramGroups, setExpandedProgramGroups] = useState<Record<string, boolean>>({})
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({})

  const hierarchyRows = useMemo<DisplayHierarchyRow[]>(() => {
    const sortByKey = (left: ProgramRow, right: ProgramRow) => {
      const leftValue = sortState.key === "code" ? left.code : left.name
      const rightValue = sortState.key === "code" ? right.code : right.name
      const compare = leftValue.localeCompare(rightValue, undefined, {
        numeric: true,
        sensitivity: "base",
      })
      return sortState.direction === "asc" ? compare : -compare
    }

    const budgetUnits = rows
      .filter((row) => row.hierarchyLevel === 0)
      .sort(sortByKey)
    const programs = rows.filter((row) => row.hierarchyLevel === 1)
    const subPrograms = rows.filter((row) => row.hierarchyLevel === 2)

    const flattened: DisplayHierarchyRow[] = []
    for (const budgetUnit of budgetUnits) {
      flattened.push({ kind: "data", row: budgetUnit })
      if (!expandedBudgetUnits[budgetUnit.id]) continue

      flattened.push({
        kind: "group",
        budgetUnitId: budgetUnit.id,
        label: "BU Program",
        hierarchyLevel: 1,
      })
      if (!expandedProgramGroups[budgetUnit.id]) continue

      const linkedPrograms = programs
        .filter((program) => program.parentId === budgetUnit.id)
        .sort(sortByKey)

      for (const program of linkedPrograms) {
        flattened.push({ kind: "data", row: { ...program, hierarchyLevel: 2 } })
        if (!expandedPrograms[program.id]) continue

        const linkedSubPrograms = subPrograms
          .filter((subProgram) => subProgram.parentId === program.id)
          .sort(sortByKey)
        for (const subProgram of linkedSubPrograms) {
          flattened.push({
            kind: "data",
            row: { ...subProgram, hierarchyLevel: 3 },
          })
        }
      }
    }
    return flattened
  }, [expandedBudgetUnits, expandedProgramGroups, expandedPrograms, rows, sortState])

  const programIdsWithChildren = useMemo(
    () =>
      new Set(
        rows
          .filter((row) => row.hierarchyLevel === 2)
          .map((row) => row.parentId)
          .filter((id): id is string => Boolean(id))
      ),
    [rows]
  )

  const handleSort = (key: ProgramSortKey) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" }
      return { key, direction: prev.direction === "asc" ? "desc" : "asc" }
    })
  }

  const toggleBudgetUnit = (budgetUnitId: string) => {
    setExpandedBudgetUnits((prev) => ({
      ...prev,
      [budgetUnitId]: !prev[budgetUnitId],
    }))
  }

  const toggleProgramGroup = (budgetUnitId: string) => {
    setExpandedProgramGroups((prev) => ({
      ...prev,
      [budgetUnitId]: !prev[budgetUnitId],
    }))
  }

  const toggleProgram = (programId: string) => {
    setExpandedPrograms((prev) => ({
      ...prev,
      [programId]: !prev[programId],
    }))
  }

  const getTooltipText = (key: ProgramSortKey) => {
    const isActive = sortState.key === key
    if (!isActive || sortState.direction === "desc") return "Click to sort ascending"
    return "Click to sort descending"
  }

  const skeletonRows = Array.from({ length: 8 }, (_, index) => `program-skeleton-${index}`)
  const rowHeightPx = 40
  const emptyStateHeightPx = 210
  const maxBodyHeightPx = 400
  const contentHeightPx = isLoading
    ? skeletonRows.length * rowHeightPx
    : hierarchyRows.length === 0
      ? emptyStateHeightPx
      : hierarchyRows.length * rowHeightPx
  const bodyHeightPx = Math.min(Math.max(contentHeightPx, rowHeightPx), maxBodyHeightPx)

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
              <col style={{ width: "70px" }} />
            </colgroup>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-[11px] font-medium text-white">
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
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-[11px] font-medium text-white">
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
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-center text-[11px] font-medium text-white">
                  Medical Pct
                </TableHead>
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-[11px] font-medium text-white">
                  Description
                </TableHead>
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-[11px] font-medium text-white">
                  Department
                </TableHead>
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-center text-[11px] font-medium text-white">
                  Active
                </TableHead>
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-center text-[11px] font-medium text-white">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div className="h-10 w-[12px] border-l border-[#8f86f0] bg-[var(--primary)]" />
      </div>
      <div className="program-table-scroll overflow-y-scroll [scrollbar-gutter:stable]" style={{ height: `${bodyHeightPx}px` }}>
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "140px" }} />
            <col style={{ width: "210px" }} />
            <col style={{ width: "150px" }} />
            <col style={{ width: "170px" }} />
            <col style={{ width: "190px" }} />
            <col style={{ width: "70px" }} />
            <col style={{ width: "70px" }} />
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
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2"><Skeleton className="mx-auto h-3.5 w-3.5 rounded-sm" /></TableCell>
                  </TableRow>
                ))
              : hierarchyRows.map((displayRow) => (
                  <TableRow
                    key={displayRow.kind === "group" ? `group-${displayRow.budgetUnitId}` : displayRow.row.id}
                    className={`min-h-[40px] border-b border-[#eff0f5] hover:bg-transparent ${
                      displayRow.kind === "group" ||
                      (displayRow.row.hierarchyLevel === 0 ||
                        (displayRow.row.hierarchyLevel === 2 &&
                          programIdsWithChildren.has(displayRow.row.id)))
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
                      if (
                        displayRow.row.hierarchyLevel === 2 &&
                        programIdsWithChildren.has(displayRow.row.id)
                      ) {
                        toggleProgram(displayRow.row.id)
                      }
                    }}
                  >
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal">
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
                          {displayRow.row.hierarchyLevel === 2 && programIdsWithChildren.has(displayRow.row.id) ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleProgram(displayRow.row.id)
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
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal">
                      {displayRow.kind === "group" ? "" : displayRow.row.name}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center text-[12px] text-[#232735] break-words whitespace-normal">
                      {displayRow.kind === "group" ? "" : displayRow.row.medicalPct}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal">
                      {displayRow.kind === "group" ? "" : displayRow.row.description}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal">
                      {displayRow.kind === "group" ? "" : displayRow.row.department}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      {displayRow.kind === "group" ? null : (
                        <img src={displayRow.row.active ? tableCheckIcon : tableCloseIcon} alt="" aria-hidden="true" className="mx-auto size-[12px] object-contain" />
                      )}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      {displayRow.kind === "group" ? null : displayRow.row.hierarchyLevel === 2 ? (
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
                              <DropdownMenuItem
                                onClick={() => onAddSubProgramFromProgram?.(displayRow.row)}
                                className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[12px] text-[#111827]"
                              >
                                <Plus className="size-[13px] text-[var(--primary)]" />
                                Add
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => onEditRow(displayRow.row)}
                                className="cursor-pointer gap-1.5 rounded-[8px] px-1.5 py-1 text-[12px] text-[#111827]"
                              >
                                <Pencil className="size-[13px] text-[var(--primary)]" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation()
                            onEditRow(displayRow.row)
                          }}
                          className="inline-flex cursor-pointer items-center opacity-80 drop-shadow-[0_1px_0_rgba(108,93,211,0.35)] transition-opacity hover:opacity-100"
                        >
                          <img src={tableEditIcon} alt="" aria-hidden="true" className="size-[11px] object-contain" />
                        </button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && hierarchyRows.length === 0 ? (
              <TableRow className="h-[210px] hover:bg-transparent">
                <TableCell colSpan={7} className="text-center text-[12px] text-[#8c93a8]">
                  No data found
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
