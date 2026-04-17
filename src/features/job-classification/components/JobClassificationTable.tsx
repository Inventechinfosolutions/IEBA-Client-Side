import { useMemo, useState } from "react"
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
  JobClassificationSortKey,
  JobClassificationTableProps,
  JobClassificationTableSortState,
} from "../types"
import { usePermissions } from "@/hooks/usePermissions"

const SKELETON_ROWS = 8

export function JobClassificationTable({
  rows,
  isLoading,
  onEditRow,
}: JobClassificationTableProps) {
  const { canUpdate } = usePermissions()
  const canUpdateJobClassification = canUpdate("jobclassification")
  const [sortState, setSortState] = useState<JobClassificationTableSortState>({
    key: "code",
    direction: "none",
  })
  const [tooltipOpenKey, setTooltipOpenKey] = useState<JobClassificationSortKey | null>(null)

  const sortedRows = useMemo(() => {
    if (sortState.direction === "none") return rows
    return [...rows].sort((a, b) => {
      const aVal = a[sortState.key].toLowerCase()
      const bVal = b[sortState.key].toLowerCase()
      if (aVal < bVal) return sortState.direction === "asc" ? -1 : 1
      if (aVal > bVal) return sortState.direction === "asc" ? 1 : -1
      return 0
    })
  }, [rows, sortState])

  const handleSort = (key: JobClassificationSortKey) => {
    setSortState((prev) => {
      if (prev.key !== key) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
      if (prev.direction === "desc") return { key, direction: "none" }
      return { key, direction: "asc" }
    })
  }

  const getTooltipText = (key: JobClassificationSortKey) => {
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
              <col style={{ width: canUpdateJobClassification ? "15%" : "17%" }} />
              <col style={{ width: canUpdateJobClassification ? "35%" : "40%" }} />
              <col style={{ width: canUpdateJobClassification ? "25%" : "28%" }} />
              <col style={{ width: canUpdateJobClassification ? "12.5%" : "15%" }} />
              {canUpdateJobClassification && <col style={{ width: "12.5%" }} />}
            </colgroup>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-[44px] border-r border-white/40 bg-(--primary) px-3 text-[12px] font-medium text-white">
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
                          <span>Code</span>
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                            <span
                              className={`h-0 w-0 border-b-[5px] border-l-4 border-r-4 border-l-transparent border-r-transparent ${
                                sortState.key === "code" && sortState.direction === "asc"
                                  ? "border-b-[#1E8BFF]"
                                  : "border-b-white/60"
                              }`}
                            />
                            <span
                              className={`mt-0.5 h-0 w-0 border-l-4 border-r-4 border-t-[5px] border-l-transparent border-r-transparent ${
                                sortState.key === "code" && sortState.direction === "desc"
                                  ? "border-t-[#201547]"
                                  : "border-t-white"
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
                <TableHead className="h-[44px] border-r border-white/40 bg-(--primary) px-3 text-[12px] font-medium text-white">
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
                          <span>Name</span>
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                            <span
                              className={`h-0 w-0 border-b-[5px] border-l-4 border-r-4 border-l-transparent border-r-transparent ${
                                sortState.key === "name" && sortState.direction === "asc"
                                  ? "border-b-[#1E8BFF]"
                                  : "border-b-white/60"
                              }`}
                            />
                            <span
                              className={`mt-0.5 h-0 w-0 border-l-4 border-r-4 border-t-[5px] border-l-transparent border-r-transparent ${
                                sortState.key === "name" && sortState.direction === "desc"
                                  ? "border-t-[#201547]"
                                  : "border-t-white"
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
                <TableHead className="h-[44px] border-r border-white/40 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                  Users
                </TableHead>
                <TableHead className="h-[44px] border-r border-white/40 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                  Active
                </TableHead>
                {canUpdateJobClassification && (
                  <TableHead className="h-[44px] bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                    Action
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div className="h-[44px] w-[12px] shrink-0 border-l border-white/20 bg-(--primary)" />
      </div>
      <div
        className="program-table-scroll overflow-y-auto [scrollbar-gutter:stable]"
        style={{ minHeight, maxHeight: "384px" }}
      >
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: canUpdateJobClassification ? "15%" : "17%" }} />
            <col style={{ width: canUpdateJobClassification ? "35%" : "40%" }} />
            <col style={{ width: canUpdateJobClassification ? "25%" : "28%" }} />
            <col style={{ width: canUpdateJobClassification ? "12.5%" : "15%" }} />
            {canUpdateJobClassification && <col style={{ width: "12.5%" }} />}
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
                      <Skeleton className="h-3.5 w-full" />
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
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal">
                      {row.code}
                    </TableCell>
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal">
                      {row.name}
                    </TableCell>

                    {/* Users */}
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal">
                      {row.users && row.users.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {row.users.map((user) => (
                            <span
                              key={user.id}
                              className="inline-flex items-center rounded-[6px] border border-[#d8dae3] bg-[#f8f9fa] px-2 py-1 text-[10px] text-[#232735]"
                            >
                              {user.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
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

                    {/* Action - only render cell if user has update permission */}
                    {canUpdateJobClassification && (
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
                    )}
                  </TableRow>
                ))}

            {!isLoading && sortedRows.length === 0 && (
              <TableRow className="h-[150px] bg-white">
                <TableCell colSpan={canUpdateJobClassification ? 5 : 4} className="text-center align-middle">
                  <img
                    src={tableEmptyIcon}
                    alt="No data"
                    aria-hidden="true"
                    className="mx-auto h-[110px] w-auto object-contain opacity-90"
                  />
                  <div className="mt-2.5 text-[13px] text-[#A0A2B1]"></div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

