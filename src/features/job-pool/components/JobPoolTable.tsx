import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import statusCrossIcon from "@/assets/status-cross.png"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type {
  JobPoolRow,
  JobPoolSortKey,
  JobPoolTableProps,
  SortDirection,
} from "../types"

const SKELETON_ROWS = 8

export function JobPoolTable({
  rows,
  isLoading,
  onEditRow,
}: JobPoolTableProps) {
  const [sortState, setSortState] = useState<{
    key: JobPoolSortKey | "jobClassifications" // Add pseudo sort key if needed
    direction: SortDirection
  }>({
    key: "name",
    direction: "none",
  })
  const [tooltipOpenKey, setTooltipOpenKey] = useState<string | null>(null)

  const sortedRows = useMemo(() => {
    if (sortState.direction === "none") return rows
    return [...rows].sort((a, b) => {
      let aVal = ""
      let bVal = ""
      if (sortState.key === "name") {
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
      } else if (sortState.key === "jobClassifications") {
        aVal = a.jobClassifications.map(c => c.name).join(",").toLowerCase()
        bVal = b.jobClassifications.map(c => c.name).join(",").toLowerCase()
      }
      
      if (aVal < bVal) return sortState.direction === "asc" ? -1 : 1
      if (aVal > bVal) return sortState.direction === "asc" ? 1 : -1
      return 0
    })
  }, [rows, sortState])

  const handleSort = (key: JobPoolSortKey | "jobClassifications") => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
      if (prev.direction === "desc") return { key, direction: "none" }
      return { key, direction: "asc" }
    })
  }

  const getTooltipText = (key: string) => {
    const isActive = sortState.key === key
    if (!isActive || sortState.direction === "none") return "Click to sort ascending"
    if (sortState.direction === "asc") return "Click to sort descending"
    return "Click to cancel sorting"
  }

  let minHeight = "auto"
  if (isLoading) minHeight = `${SKELETON_ROWS * 48}px`
  else if (sortedRows.length === 0) minHeight = "150px"

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#e6e7ef]">
      <div className="flex">
        <div className="min-w-0 flex-1">
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: "12%" }} />
              <col style={{ width: "61%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "7.5%" }} />
              <col style={{ width: "7.5%" }} />
            </colgroup>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-[44px] border-r border-white/20 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
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
                          <span>Job Pool</span>
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
                <TableHead className="h-[44px] border-r border-white/20 bg-[var(--primary)] px-3 text-[12px] font-medium text-white">
                  <TooltipProvider>
                    <Tooltip open={tooltipOpenKey === "jobClassifications"}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSort("jobClassifications")}
                          onMouseEnter={() => setTooltipOpenKey("jobClassifications")}
                          onMouseLeave={() => setTooltipOpenKey(null)}
                          onFocus={() => setTooltipOpenKey("jobClassifications")}
                          onBlur={() => setTooltipOpenKey(null)}
                          className="relative flex h-full w-full cursor-pointer items-center justify-start pr-4 text-left text-white"
                        >
                          <span>Job Classification</span>
                          <span className="pointer-events-none absolute right-[0px] inline-flex flex-col items-center leading-none">
                            <ChevronUp
                              className={`size-[10px] ${
                                sortState.key === "jobClassifications" && sortState.direction === "asc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                            <ChevronDown
                              className={`-mt-1 size-[10px] ${
                                sortState.key === "jobClassifications" && sortState.direction === "desc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        {getTooltipText("jobClassifications")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="h-[44px] border-r border-white/20 bg-[var(--primary)] px-3 text-center text-[12px] font-medium text-white">
                  Department
                </TableHead>
                <TableHead className="h-[44px] border-r border-white/20 bg-[var(--primary)] px-3 text-center text-[12px] font-medium text-white">
                  Active
                </TableHead>
                <TableHead className="h-[44px] bg-[var(--primary)] px-3 text-center text-[12px] font-medium text-white">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div className="h-[44px] w-[12px] border-l border-white/20 bg-[var(--primary)]" />
      </div>
      <div
        className="program-table-scroll overflow-y-auto [scrollbar-gutter:stable]"
        style={{ minHeight, maxHeight: "450px" }}
      >
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "12%" }} />
            <col style={{ width: "61%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "7.5%" }} />
            <col style={{ width: "7.5%" }} />
          </colgroup>
          <TableBody>
            {isLoading
              ? Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                  <TableRow
                    key={i}
                    className="h-[48px] border-b border-[#eff0f5] bg-white hover:bg-[#fafafa]"
                  >
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                      <Skeleton className="h-3.5 w-[70%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                      <Skeleton className="h-3.5 w-[80%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2">
                      <Skeleton className="h-3.5 w-[80%]" />
                    </TableCell>
                    <TableCell className="border-r border-[#eff0f5] px-3 py-2 text-center">
                      <Skeleton className="mx-auto h-5 w-5 rounded-sm" />
                    </TableCell>
                    <TableCell className="px-3 py-2 text-center">
                      <Skeleton className="mx-auto h-[18px] w-[18px] rounded-sm" />
                    </TableCell>
                  </TableRow>
                ))
              : sortedRows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="h-[48px] border-b border-[#eff0f5] bg-white hover:bg-[#fafafa]"
                  >
                    {/* Job Pool */}
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] break-words whitespace-normal">
                      {row.name}
                    </TableCell>
                    
                    {/* Job Classification tags */}
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] break-words whitespace-normal">
                      <div className="flex flex-wrap gap-2">
                        {row.jobClassifications.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center rounded-[6px] border border-[#d8dae3] bg-[#f8f9fa] px-2 py-1 text-[10px] text-[#232735]"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    {/* Department */}
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] break-words whitespace-normal text-center">
                      {row.department}
                    </TableCell>

                    {/* Active */}
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-center whitespace-normal">
                      {row.active ? (
                        <img
                          src={tableCheckIcon}
                          alt="Active"
                          aria-hidden="true"
                          className="mx-auto size-[16px] object-contain"
                        />
                      ) : (
                        <img
                          src={statusCrossIcon}
                          alt="Inactive"
                          aria-hidden="true"
                          className="mx-auto size-[16px] object-contain"
                        />
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="align-middle px-4 py-2.5 text-center whitespace-normal">
                      <button
                        type="button"
                        onClick={() => onEditRow(row)}
                        className="inline-flex cursor-pointer items-center justify-center opacity-80 drop-shadow-[0_1px_0_rgba(108,93,211,0.35)] transition-opacity hover:opacity-100 p-1"
                      >
                        <img
                          src={tableEditIcon}
                          alt="Edit"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}

            {!isLoading && sortedRows.length === 0 && (
              <TableRow className="h-[150px] bg-white hover:bg-white transition-none">
                <TableCell colSpan={5} className="text-center align-middle">
                  <img
                    src={tableEmptyIcon}
                    alt="No data"
                    aria-hidden="true"
                    className="mx-auto h-[85px] w-auto object-contain opacity-80"
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

