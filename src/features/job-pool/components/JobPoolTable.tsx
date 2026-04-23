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
  JobPoolSortKey,
  JobPoolTableProps,
  JobPoolTableSortState,
} from "../types"
import { usePermissions } from "@/hooks/usePermissions"

const SKELETON_ROWS = 8

function formatUserName(user: {
  name?: string
  firstName?: string
  lastName?: string
}): string {
  const full =
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    (user.name ?? "").trim()
  return full
}

function usersSortValue(row: { userprofiles?: { name?: string; firstName?: string; lastName?: string }[] }): string {
  const list = Array.isArray(row.userprofiles) ? row.userprofiles : []
  return list
    .map((u) => formatUserName(u))
    .filter(Boolean)
    .join(",")
    .toLowerCase()
}

export function JobPoolTable({
  rows,
  isLoading,
  onEditRow,
}: JobPoolTableProps) {
  const { canUpdate } = usePermissions()
  const canUpdateJobPool = canUpdate("jobpool")
  const [sortState, setSortState] = useState<JobPoolTableSortState>({
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
      } else if (sortState.key === "users") {
        aVal = usersSortValue(a)
        bVal = usersSortValue(b)
      }
      
      if (aVal < bVal) return sortState.direction === "asc" ? -1 : 1
      if (aVal > bVal) return sortState.direction === "asc" ? 1 : -1
      return 0
    })
  }, [rows, sortState])

  const handleSort = (key: JobPoolSortKey) => {
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
              <col style={{ width: canUpdateJobPool ? "12%" : "13.5%" }} />
              <col style={{ width: canUpdateJobPool ? "42%" : "46.5%" }} />
              <col style={{ width: canUpdateJobPool ? "19%" : "21%" }} />
              <col style={{ width: canUpdateJobPool ? "12%" : "13%" }} />
              <col style={{ width: canUpdateJobPool ? "7.5%" : "6%" }} />
              {canUpdateJobPool && <col style={{ width: "7.5%" }} />}
            </colgroup>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-[44px] border-r border-white/20 bg-(--primary) px-3 text-[12px] font-medium text-white">
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
                <TableHead className="h-[44px] border-r border-white/20 bg-(--primary) px-3 text-[12px] font-medium text-white">
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
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
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
                <TableHead className="h-[44px] border-r border-white/20 bg-(--primary) px-3 text-[12px] font-medium text-white">
                  <TooltipProvider>
                    <Tooltip open={tooltipOpenKey === "users"}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSort("users")}
                          onMouseEnter={() => setTooltipOpenKey("users")}
                          onMouseLeave={() => setTooltipOpenKey(null)}
                          onFocus={() => setTooltipOpenKey("users")}
                          onBlur={() => setTooltipOpenKey(null)}
                          className="relative flex h-full w-full cursor-pointer items-center justify-start pr-4 text-left text-white"
                        >
                          <span>Users</span>
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                            <ChevronUp
                              className={`size-[10px] ${
                                sortState.key === "users" && sortState.direction === "asc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                            <ChevronDown
                              className={`-mt-1 size-[10px] ${
                                sortState.key === "users" && sortState.direction === "desc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        {getTooltipText("users")}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead className="h-[44px] border-r border-white/20 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                  Department
                </TableHead>
                <TableHead className="h-[44px] border-r border-white/20 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                  Active
                </TableHead>
                {canUpdateJobPool && (
                  <TableHead className="h-[44px] bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                    Action
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div className="h-[44px] w-[12px] border-l border-white/20 bg-(--primary)" />
      </div>
      <div
        className="program-table-scroll overflow-y-auto [scrollbar-gutter:stable]"
        style={{ minHeight, maxHeight: "450px" }}
      >
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: canUpdateJobPool ? "12%" : "13.5%" }} />
            <col style={{ width: canUpdateJobPool ? "42%" : "46.5%" }} />
            <col style={{ width: canUpdateJobPool ? "19%" : "21%" }} />
            <col style={{ width: canUpdateJobPool ? "12%" : "13%" }} />
            <col style={{ width: canUpdateJobPool ? "7.5%" : "6%" }} />
            {canUpdateJobPool && <col style={{ width: "7.5%" }} />}
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
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal">
                      {row.name}
                    </TableCell>
                    
                    {/* Job Classification tags */}
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal">
                      <div className="flex flex-wrap gap-2">
                        {row.jobClassifications.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center rounded-[6px] bg-[#f8f9fa] px-2 py-1 text-[10px] text-[#232735] ${
                              tag.status?.toLowerCase() === "inactive"
                                ? "border border-red-300"
                                : "border border-[#d8dae3]"
                            }`}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>

                    {/* Users */}
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal">
                      {row.userprofiles && row.userprofiles.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {row.userprofiles
                            .map((u) => ({
                              id: u.id,
                              label: formatUserName(u),
                              status: u.status,
                            }))
                            .filter((u) => u.id && u.label)
                            .map((u) => (
                              <span
                                key={u.id}
                                className={`inline-flex items-center rounded-[6px] bg-[#f8f9fa] px-2 py-1 text-[10px] text-[#232735] ${
                                  u.status?.toLowerCase() === "inactive"
                                    ? "border border-red-300"
                                    : "border border-[#d8dae3]"
                                }`}
                              >
                                {u.label}
                              </span>
                            ))}
                        </div>
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </TableCell>

                    {/* Department */}
                    <TableCell className="align-middle border-r border-[#eff0f5] px-3 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal text-center">
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

                    {/* Action - only render cell if user has permission */}
                    {canUpdateJobPool && (
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
              <TableRow className="h-[150px] bg-white hover:bg-white transition-none">
                <TableCell colSpan={canUpdateJobPool ? 6 : 5} className="text-center align-middle">
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

