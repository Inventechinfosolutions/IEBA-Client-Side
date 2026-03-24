import { useMemo, useState } from "react"
import { ChevronDown, ChevronRight, ChevronUp, EllipsisVertical, Pencil } from "lucide-react"

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
  ProgramRow,
  ProgramSortKey,
  ProgramTableSortState,
  TimeStudyProgramTableProps,
} from "../types"

export function TimeStudyProgramTable({ rows, isLoading, onEditRow }: TimeStudyProgramTableProps) {
  const [sortState, setSortState] = useState<ProgramTableSortState>({
    key: "code",
    direction: "asc",
  })
  const [tooltipOpenKey, setTooltipOpenKey] = useState<ProgramSortKey | null>(null)
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({})

  const sortedPrograms = useMemo(() => {
    const result = rows.filter((row) => row.hierarchyLevel === 0)
    result.sort((a, b) => {
      const left = sortState.key === "code" ? a.code : a.name
      const right = sortState.key === "code" ? b.code : b.name
      const compare = left.localeCompare(right, undefined, {
        numeric: true,
        sensitivity: "base",
      })
      return sortState.direction === "asc" ? compare : -compare
    })
    return result
  }, [rows, sortState])

  const subProgramsByParentId = useMemo(() => {
    const map = new Map<string, ProgramRow[]>()
    for (const row of rows) {
      if (row.hierarchyLevel !== 1 || !row.parentId) continue
      const current = map.get(row.parentId) ?? []
      current.push(row)
      map.set(row.parentId, current)
    }
    for (const [, list] of map) {
      list.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" })
      )
    }
    return map
  }, [rows])

  const displayRows = useMemo(() => {
    const flattened: ProgramRow[] = []
    for (const parent of sortedPrograms) {
      flattened.push(parent)
      if (!expandedPrograms[parent.id]) continue
      const children = subProgramsByParentId.get(parent.id) ?? []
      flattened.push(...children)
    }
    return flattened
  }, [expandedPrograms, sortedPrograms, subProgramsByParentId])

  const handleSort = (key: ProgramSortKey) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" }
      return {
        key,
        direction: prev.direction === "asc" ? "desc" : "asc",
      }
    })
  }

  const getTooltipText = (key: ProgramSortKey) => {
    const isActive = sortState.key === key
    if (!isActive || sortState.direction === "desc") return "Click to sort ascending"
    return "Click to sort descending"
  }

  const skeletonRows = Array.from({ length: 8 }, (_, index) => `ts-program-skeleton-${index}`)
  const rowHeightPx = 40
  const emptyStateHeightPx = 210
  const maxBodyHeightPx = 400
  const contentHeightPx = isLoading
    ? skeletonRows.length * rowHeightPx
    : displayRows.length === 0
      ? emptyStateHeightPx
      : displayRows.length * rowHeightPx
  const bodyHeightPx = Math.min(Math.max(contentHeightPx, rowHeightPx), maxBodyHeightPx)

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
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-[11px] font-medium text-white">
                  BU Program
                </TableHead>
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-[11px] font-medium text-white">
                  Department
                </TableHead>
                <TableHead className="h-10 border-r border-[#8f86f0] bg-[var(--primary)] px-3 text-[11px] font-medium text-white">
                  MultiCodes
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
                  <TableRow key={row.id} className="min-h-[40px] border-b border-[#eff0f5] hover:bg-transparent">
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal">
                      <div className="flex items-center gap-1" style={{ paddingLeft: row.hierarchyLevel === 1 ? "14px" : "0px" }}>
                        {row.hierarchyLevel === 0 && (subProgramsByParentId.get(row.id)?.length ?? 0) > 0 ? (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setExpandedPrograms((prev) => ({
                                ...prev,
                                [row.id]: !prev[row.id],
                              }))
                            }}
                            className="inline-flex cursor-pointer items-center text-[var(--primary)]"
                            aria-label="Toggle TS sub programs"
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
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal">{row.name}</TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal">
                      {row.hierarchyLevel === 0
                        ? row.parentBudgetUnitName ?? ""
                        : row.parentProgramName ?? ""}
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal">{row.department}</TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-[12px] text-[#232735] break-words whitespace-normal"></TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      <img src={row.active ? tableCheckIcon : tableCloseIcon} alt="" aria-hidden="true" className="mx-auto size-[12px] object-contain" />
                    </TableCell>
                    <TableCell className="align-top border-r border-[#eff0f5] px-3 py-2 text-center whitespace-normal">
                      {row.hierarchyLevel === 1 ? (
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
                                onClick={() => onEditRow(row)}
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
                ))}
            {!isLoading && displayRows.length === 0 ? (
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
