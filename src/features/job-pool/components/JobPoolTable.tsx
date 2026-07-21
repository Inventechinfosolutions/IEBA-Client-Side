import { useMemo, useState } from "react"
import { ChevronDown, ChevronUp, History } from "lucide-react"

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
  onHistoryRow,
}: JobPoolTableProps) {
  const { canUpdate, isSuperAdmin } = usePermissions()
  const canUpdateJobPool = canUpdate("jobpool")
  const showActionColumn = canUpdateJobPool || Boolean(onHistoryRow && isSuperAdmin)
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
    <div className="space-y-4">
      {/* Desktop View Table */}
      <div className="hidden xl:block overflow-hidden rounded-[4px] border border-[#e6e7ef]">
        <div className="overflow-y-auto [scrollbar-gutter:stable] bg-[#6C5DD3]">
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: showActionColumn ? "12%" : "13.5%" }} />
              <col style={{ width: showActionColumn ? "34%" : "41.5%" }} />
              <col style={{ width: showActionColumn ? "24%" : "26%" }} />
              <col style={{ width: showActionColumn ? "12%" : "13%" }} />
              <col style={{ width: showActionColumn ? "8%" : "6%" }} />
              {showActionColumn && <col style={{ width: "10%" }} />}
            </colgroup>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
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
                          <span>Job Pool</span>
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                            <ChevronUp
                              className={`size-[10px] ${sortState.key === "name" && sortState.direction === "asc"
                                ? "text-white"
                                : "text-white/50"
                                }`}
                            />
                            <ChevronDown
                              className={`-mt-1 size-[10px] ${sortState.key === "name" && sortState.direction === "desc"
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
                <TableHead className="h-[44px] border-r border-white/40 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
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
                          className="relative flex h-full w-full cursor-pointer items-center justify-center pr-4 text-center text-white"
                        >
                          <span>Job Classification</span>
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                            <ChevronUp
                              className={`size-[10px] ${sortState.key === "jobClassifications" && sortState.direction === "asc"
                                ? "text-white"
                                : "text-white/50"
                                }`}
                            />
                            <ChevronDown
                              className={`-mt-1 size-[10px] ${sortState.key === "jobClassifications" && sortState.direction === "desc"
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
                <TableHead className="h-[44px] border-r border-white/40 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
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
                          className="relative flex h-full w-full cursor-pointer items-center justify-center pr-4 text-center text-white"
                        >
                          <span>Users</span>
                          <span className="pointer-events-none absolute right-0 inline-flex flex-col items-center leading-none">
                            <ChevronUp
                              className={`size-[10px] ${sortState.key === "users" && sortState.direction === "asc"
                                ? "text-white"
                                : "text-white/50"
                                }`}
                            />
                            <ChevronDown
                              className={`-mt-1 size-[10px] ${sortState.key === "users" && sortState.direction === "desc"
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
                <TableHead className="h-[44px] border-r border-white/40 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                  Department
                </TableHead>
                <TableHead className="h-[44px] border-r border-white/40 bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                  Active
                </TableHead>
                {showActionColumn && (
                  <TableHead className="h-[44px] bg-(--primary) px-3 text-center text-[12px] font-medium text-white">
                    Action
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
          </Table>
        </div>
        <div
          className="program-table-scroll overflow-y-auto [scrollbar-gutter:stable]"
          style={{ minHeight, maxHeight: "450px" }}
        >
          <Table className="table-fixed">
            <colgroup>
              <col style={{ width: showActionColumn ? "12%" : "13.5%" }} />
              <col style={{ width: showActionColumn ? "34%" : "41.5%" }} />
              <col style={{ width: showActionColumn ? "24%" : "26%" }} />
              <col style={{ width: showActionColumn ? "12%" : "13%" }} />
              <col style={{ width: showActionColumn ? "8%" : "6%" }} />
              {showActionColumn && <col style={{ width: "10%" }} />}
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
                  <TableCell className="align-middle border-r border-[#eff0f5] px-1.5 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal text-center">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {row.jobClassifications.map((tag, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center rounded-[7px] bg-[#f8f9fa] dark:bg-[#1c192d] px-1.5 py-0.5 text-[10px] text-[#232735] dark:text-[#e4e4e7] ${tag.status?.toLowerCase() === "inactive"
                            ? "border border-red-300"
                            : "border border-[#d8dae3] dark:border-[rgba(108,93,211,0.5)]!"
                            }`}
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  {/* Users */}
                  <TableCell className="align-middle border-r border-[#eff0f5] px-1.5 py-2.5 text-[11px] text-[#232735] wrap-break-word whitespace-normal text-center">
                    {row.userprofiles && row.userprofiles.length > 0 ? (
                      <div className="flex flex-wrap gap-2 justify-center">
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
                              title={u.label}
                              className={`inline-flex items-center justify-center rounded-[7px] border bg-[#f8f9fa] dark:bg-[#1c192d] px-1.5 py-0.5 text-[10px] text-[#232735] dark:text-[#e4e4e7] w-[calc(50%-4px)] text-center ${u.status?.toLowerCase() === "inactive"
                                ? "border-red-400"
                                : "border-[#d8dae3] dark:border-[rgba(108,93,211,0.5)]!"
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
                    {showActionColumn && (
                      <TableCell className="align-middle px-2 py-2.5 text-center whitespace-normal">
                        <div className="inline-flex items-center justify-center gap-0.5">
                          {onHistoryRow && isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => onHistoryRow(row)}
                              className="inline-flex cursor-pointer items-center justify-center rounded-sm p-1 text-[#6C5DD3] opacity-80 transition-opacity hover:opacity-100"
                              aria-label={`View history for ${row.name}`}
                            >
                              <History className="size-[14px]" strokeWidth={2} />
                            </button>
                          ) : null}
                          {canUpdateJobPool ? (
                            <button
                              type="button"
                              onClick={() => onEditRow(row)}
                              className="inline-flex cursor-pointer items-center justify-center opacity-80 drop-shadow-[0_1px_0_rgba(108,93,211,0.35)] transition-opacity hover:opacity-100 p-1"
                              aria-label={`Edit ${row.name}`}
                            >
                              <img
                                src={tableEditIcon}
                                alt="Edit"
                                aria-hidden="true"
                                className="size-[16px] object-contain"
                              />
                            </button>
                          ) : null}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}

              {!isLoading && sortedRows.length === 0 && (
                <TableRow className="h-[150px] bg-white hover:bg-white transition-none">
                  <TableCell colSpan={showActionColumn ? 6 : 5} className="text-center align-middle">
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

      {/* Mobile/Tablet Cards View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:hidden bg-[#F9FAFB] p-4 rounded-[4px] border border-[#e6e7ef]">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 space-y-4 animate-pulse">
                <Skeleton className="h-6 w-1/3 rounded bg-gray-200" />
                <Skeleton className="h-4 w-2/3 rounded bg-gray-200" />
                <Skeleton className="h-4 w-full rounded bg-gray-200" />
              </div>
            ))
          : sortedRows.map((row) => (
              <div
                key={row.id}
                className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden text-[13px] text-[#111827] flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between bg-[#6C5DD3] px-5 py-3 text-white">
                  <span className="font-bold text-[14px]">{row.name}</span>
                  <div className="flex items-center gap-1.5">
                    {onHistoryRow && isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => onHistoryRow(row)}
                        className="inline-flex cursor-pointer items-center justify-center p-1 rounded hover:bg-white/10 text-white"
                        aria-label={`View history for ${row.name}`}
                      >
                        <History className="size-[14px]" strokeWidth={2.5} />
                      </button>
                    )}
                    {canUpdateJobPool && (
                      <button
                        type="button"
                        onClick={() => onEditRow(row)}
                        className="inline-flex cursor-pointer items-center justify-center p-1 rounded hover:bg-white/10"
                        aria-label={`Edit ${row.name}`}
                      >
                        <img
                          src={tableEditIcon}
                          alt="Edit"
                          aria-hidden="true"
                          className="size-[16px] object-contain brightness-0 invert"
                        />
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3.5 flex-1">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider">Department:</span>
                    <span className="font-normal text-gray-600 text-right text-[13px]">{row.department}</span>
                  </div>

                  <div className="flex flex-col border-b border-gray-100 pb-2">
                    <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider mb-1">Job Classification:</span>
                    <div className="flex flex-wrap gap-1.5 justify-start">
                      {row.jobClassifications && row.jobClassifications.length > 0 ? (
                        row.jobClassifications.map((tag, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center rounded-[6px] border bg-[#f8f9fa] px-2 py-0.5 text-[10px] text-[#4b5563] font-normal ${tag.status?.toLowerCase() === "inactive" ? "border-red-400 bg-red-50" : "border-[#d8dae3]"}`}
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col border-b border-gray-100 pb-2">
                    <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider mb-1">Users:</span>
                    <div className="flex flex-wrap gap-1.5 justify-start">
                      {row.userprofiles && row.userprofiles.length > 0 ? (
                        row.userprofiles
                          .map((u) => ({
                            id: u.id,
                            label: formatUserName(u),
                            status: u.status,
                          }))
                          .filter((u) => u.id && u.label)
                          .map((u) => (
                            <span
                              key={u.id}
                              className={`inline-flex items-center rounded-[6px] border bg-[#f8f9fa] px-2 py-0.5 text-[10px] text-[#4b5563] font-normal ${u.status?.toLowerCase() === "inactive" ? "border-red-400 bg-red-50" : "border-[#d8dae3]"}`}
                            >
                              {u.label}
                            </span>
                          ))
                      ) : (
                        <span className="text-[#9ca3af]">—</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pb-1">
                    <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider">Status:</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-normal ${row.active ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}
                    >
                      {row.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {!isLoading && sortedRows.length === 0 && (
        <div className="h-[150px] flex items-center justify-center border border-[#E5E7EB] rounded-[10px] bg-white xl:hidden">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[85px] w-auto object-contain opacity-80"
          />
        </div>
      )}
    </div>
  )
}

