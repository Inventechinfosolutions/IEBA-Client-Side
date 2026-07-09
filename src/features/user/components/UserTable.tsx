import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import tableSwitchUserIcon from "@/assets/icons/table-switch-user.png"
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
import type { UserTableProps } from "@/features/user/types"
import { usePermissions } from "@/hooks/usePermissions"
import { Spinner } from "@/components/ui/spinner"

export function UserTable({ rows, isLoading, onEditRow, onSwitchUser, sortState, onSortChange }: UserTableProps) {
  const { canUpdate } = usePermissions()
  const canUpdateUser = canUpdate("user")
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const [expandedMultiCodeRowIds, setExpandedMultiCodeRowIds] = useState<Record<string, boolean>>({})
  const [isEmployeeTooltipOpen, setIsEmployeeTooltipOpen] = useState(false)
  const showSwitchUser = typeof onSwitchUser === "function"
  const headers = [
    "Employee",
    "Department",
    "Supervisor",
    "SPMP",
    "TS Min/day",
    "Programs",
    "Activities",
    "Supervisor Apportioning",
    "Multicodes enabled?",
    "Assigned Multi Codes",
    ...(canUpdateUser ? ["Action"] : []),
    ...(showSwitchUser ? (["Switch User"] as const) : []),
  ]

  const skeletonRows = Array.from(
    { length: 10 },
    (_, index) => `skeleton-row-${index}`
  )
  const sortedRows = rows

  return (
    <>
      {/* ── Mobile/Tablet card view (hidden on xl+) ────────────── */}
      <div className="block xl:hidden">
        {isLoading ? (
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-8 text-center shadow-sm">
            <Spinner className="text-[#6C5DD3] mx-auto" />
            <p className="mt-2 text-[12px] text-gray-500">Loading users...</p>
          </div>
        ) : sortedRows.length === 0 ? (
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-8 text-center text-[13px] text-[#6B7280] shadow-sm">
            No users found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {sortedRows.map((row) => {
              const isExpanded = Boolean(expandedRowIds[row.id])
              const hasRoles = row.roleAssignments && row.roleAssignments.length > 0

              return (
                <div
                  key={row.id}
                  className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden hover:border-[#6C5DD3]/40 transition-colors flex flex-col"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-2.5 gap-2">
                    <span className="text-[14px] font-semibold text-white truncate">
                      {row.employee}
                    </span>
                    {hasRoles && (
                      <button
                        type="button"
                        className="inline-flex size-6 shrink-0 items-center justify-center rounded-[6px] bg-white/20 text-white hover:bg-white/30"
                        onClick={() =>
                          setExpandedRowIds((prev) => ({ ...prev, [row.id]: !prev[row.id] }))
                        }
                      >
                        {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2.5 text-[13px]">
                      {/* Department */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-baseline gap-x-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold shrink-0">Dept:</span>
                          <span className="text-gray-600 font-normal break-words min-w-0">{row.department}</span>
                        </div>
                        {/* Roles assignment list */}
                        {isExpanded && hasRoles && (
                          <div className="mt-1 flex flex-wrap gap-1 pl-1">
                            {row.roleAssignments?.map((role) => (
                              <span
                                key={`${row.id}-${role}`}
                                className="rounded-[6px] border border-[#d7dbe7] bg-white px-2 py-0.5 text-[10px] text-[#555f76]"
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Supervisor */}
                      <div className="flex flex-wrap items-baseline gap-x-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold shrink-0">Supervisor:</span>
                        <span className="text-gray-600 font-normal break-words min-w-0">
                          {row.supervisorPrimary}
                          {row.supervisorSecondary ? ` / ${row.supervisorSecondary}` : ""}
                        </span>
                      </div>

                      {/* TS Min/day */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">TS Min/day:</span>
                        <span className="text-gray-600 font-medium">{row.tsMinDay}</span>
                      </div>

                      {/* Flags row */}
                      <div className="flex flex-wrap gap-3 pt-1">
                        {[
                          { label: "SPMP", val: row.spmp },
                          { label: "Programs", val: row.programs },
                          { label: "Activities", val: row.activities },
                          { label: "Apport.", val: row.supervisorApportioning },
                          { label: "Multicodes", val: row.multicodesEnabled },
                        ].map(({ label, val }) => (
                          <div key={label} className="flex items-center gap-1">
                            <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">{label}:</span>
                            <img
                              src={val ? tableCheckIcon : tableCloseIcon}
                              alt={val ? "Yes" : "No"}
                              className="h-3.5 w-3.5 object-contain"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Assigned Multi Codes detailed */}
                      {row.assignedMultiCodesDetailed && row.assignedMultiCodesDetailed.length > 0 && (
                        <div className="border-t border-gray-100 pt-2.5 mt-2.5 space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider text-gray-800 font-bold">Assigned Multi Codes:</span>
                          <div className="flex flex-col gap-1.5 pl-1">
                            {row.assignedMultiCodesDetailed.map((detail) => {
                              const key = `${row.id}-${detail.departmentName}`
                              const isDetailExpanded = Boolean(expandedMultiCodeRowIds[key])
                              return (
                                <div key={key} className="text-[12px]">
                                  <button
                                    type="button"
                                    className="inline-flex cursor-pointer items-center gap-1 text-left text-gray-700 hover:text-[var(--primary)] font-medium"
                                    onClick={() =>
                                      setExpandedMultiCodeRowIds((prev) => ({
                                        ...prev,
                                        [key]: !prev[key],
                                      }))
                                    }
                                  >
                                    {isDetailExpanded ? (
                                      <ChevronDown className="size-3 text-[var(--primary)]" />
                                    ) : (
                                      <ChevronRight className="size-3 text-[var(--primary)]" />
                                    )}
                                    {detail.departmentName}
                                  </button>
                                  {isDetailExpanded && (
                                    <div className="mt-1 pl-4 flex flex-wrap gap-1">
                                      {detail.codes.split(", ").map((code) => (
                                        <span
                                          key={code}
                                          className="rounded-[6px] border border-[#d7dbe7] bg-[#f8fafc] px-2 py-0.5 text-[10px] text-[#555f76] whitespace-nowrap"
                                        >
                                          {code}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions (Edit / Switch User) */}
                    {(canUpdateUser || showSwitchUser) && (
                      <div className="flex items-center justify-end gap-3 pt-2.5 border-t border-gray-100 mt-2.5">
                        {canUpdateUser && (
                          <button
                            type="button"
                            onClick={() => onEditRow(row)}
                            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] font-medium text-[#6C5DD3] hover:bg-[#F3F0FF] transition-colors"
                          >
                            <img src={tableEditIcon} alt="Edit" className="h-3.5 w-3.5 object-contain" />
                            <span>Edit</span>
                          </button>
                        )}
                        {showSwitchUser && (
                          <button
                            type="button"
                            onClick={() => onSwitchUser(row)}
                            className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-[6px] border border-[#e2e8f0] bg-white px-3 text-[12px] font-medium text-[#6C5DD3] hover:bg-[#F3F0FF] transition-colors"
                          >
                            <img src={tableSwitchUserIcon} alt="Switch User" className="h-3.5 w-3.5 object-contain" />
                            <span>Switch User</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Desktop table view (hidden below xl) ─────────────── */}
      <div className="hidden xl:block overflow-hidden rounded-[4px] border border-[#e6e7ef]">
        <Table className="table-fixed">
          <colgroup>
            <col style={{ width: "150px" }} />
            <col style={{ width: "130px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "45px" }} />
            <col style={{ width: "65px" }} />
            <col style={{ width: "65px" }} />
            <col style={{ width: "65px" }} />
            <col style={{ width: "95px" }} />
            <col style={{ width: "95px" }} />
            <col style={{ width: "90px" }} />
            {canUpdateUser ? <col style={{ width: "70px" }} /> : null}
            {showSwitchUser ? <col style={{ width: "70px" }} /> : null}
          </colgroup>
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="hover:bg-transparent">
              {headers.map((header, idx) => (
                <TableHead
                  key={header}
                  className={`h-10 bg-[var(--primary)] p-[8px] text-[12px] leading-[1.15] font-normal text-white whitespace-normal break-words ${
                    idx === headers.length - 1 ? "border-r-0" : "border-r border-white/50"
                  } ${idx >= 3 ? "text-center" : ""}`}
                >
                  {idx === 0 ? (
                    <TooltipProvider>
                      <Tooltip open={isEmployeeTooltipOpen}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() =>
                              onSortChange(
                                sortState === "none" ? "asc" : sortState === "asc" ? "desc" : "none"
                              )
                            }
                            onMouseEnter={() => setIsEmployeeTooltipOpen(true)}
                            onMouseLeave={() => setIsEmployeeTooltipOpen(false)}
                            onFocus={() => setIsEmployeeTooltipOpen(true)}
                            onBlur={() => setIsEmployeeTooltipOpen(false)}
                            className="inline-flex w-full cursor-pointer items-center justify-between gap-1.5"
                          >
                            <span>{header}</span>
                            <span className="ml-1 inline-flex flex-col items-center leading-none">
                              <ChevronUp
                                className={`size-[10px] ${
                                  sortState === "asc"
                                    ? "text-white"
                                    : "text-white/50"
                                }`}
                              />
                              <ChevronDown
                                className={`-mt-1 size-[10px] ${
                                  sortState === "desc"
                                    ? "text-white"
                                    : "text-white/50"
                                }`}
                              />
                            </span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={6}>
                          {sortState === "none"
                            ? "Click to sort ascending"
                            : sortState === "asc"
                              ? "Click to sort descending"
                              : "Click to cancel sorting"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                  <span
                    className={`inline-flex items-center gap-1 ${
                      idx >= 3 ? "w-full justify-center" : ""
                    }`}
                  >
                    {header}
                  </span>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? skeletonRows.map((rowId) => (
                <TableRow
                  key={rowId}
                  className="h-10 border-b border-[#eff0f5] hover:bg-transparent"
                >
                  {headers.map((header) => (
                    <TableCell
                      key={`${rowId}-${header}`}
                      className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center last:border-r-0"
                    >
                      <Skeleton className="mx-auto h-3.5 w-[70%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : sortedRows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-[#eff0f5] hover:bg-[#fafafa]"
                >
                  <TableCell className="align-top border-r border-[#eff0f5] px-[14px] py-[5px] text-[12px] text-[#232735] whitespace-normal break-words">
                    {row.employee}
                  </TableCell>
                  <TableCell className="align-top border-r border-[#eff0f5] px-[14px] py-[5px] text-[12px] text-[#232735] whitespace-normal break-words">
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-start gap-1 text-left"
                      onClick={() =>
                        setExpandedRowIds((prev) => ({
                          ...prev,
                          [row.id]: !prev[row.id],
                        }))
                      }
                    >
                      {expandedRowIds[row.id] ? (
                        <ChevronDown className="mt-px size-3 shrink-0 text-[var(--primary)]" aria-hidden />
                      ) : (
                        <ChevronRight className="mt-px size-3 shrink-0 text-[var(--primary)]" aria-hidden />
                      )}
                      {row.department}
                    </button>
                    {expandedRowIds[row.id] ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(row.roleAssignments ?? []).map((role) => (
                          <span
                            key={`${row.id}-${role}`}
                            className="rounded-[6px] border border-[#d7dbe7] bg-white px-2 py-0.5 text-[10px] text-[#555f76]"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="align-top border-r border-[#eff0f5] px-[14px] py-[5px] text-[11px] leading-[1.1rem] text-[#232735] whitespace-normal break-words">
                    <div>{row.supervisorPrimary}</div>
                    <div>{row.supervisorSecondary ?? ""}</div>
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center">
                    {row.spmp ? (
                      <img
                        src={tableCheckIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    ) : (
                      <img
                        src={tableCloseIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center text-[12px] text-[#232735]">
                    {row.tsMinDay}
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center">
                    {row.programs ? (
                      <img
                        src={tableCheckIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    ) : (
                      <img
                        src={tableCloseIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center">
                    {row.activities ? (
                      <img
                        src={tableCheckIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    ) : (
                      <img
                        src={tableCloseIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center">
                    {row.supervisorApportioning ? (
                      <img
                        src={tableCheckIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    ) : (
                      <img
                        src={tableCloseIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center">
                    {row.multicodesEnabled ? (
                      <img
                        src={tableCheckIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    ) : (
                      <img
                        src={tableCloseIcon}
                        alt=""
                        aria-hidden="true"
                        className="mx-auto size-[12px] object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="align-top border-r border-[#eff0f5] px-2 py-[5px] text-[12px] text-[#232735] whitespace-normal break-words">
                    {row.assignedMultiCodesDetailed && row.assignedMultiCodesDetailed.length > 0 ? (
                      <div className="flex flex-col items-start gap-1.5">
                        {row.assignedMultiCodesDetailed.map((detail, idx) => {
                          const key = `${row.id}-${detail.departmentName}`
                          const isExpanded = expandedMultiCodeRowIds[key]
                          return (
                            <div key={key} className="flex flex-col items-start">
                              <button
                                type="button"
                                className="inline-flex cursor-pointer items-start gap-1 text-left"
                                onClick={() =>
                                  setExpandedMultiCodeRowIds((prev) => ({
                                    ...prev,
                                    [key]: !prev[key],
                                  }))
                                }
                              >
                                {isExpanded ? (
                                  <ChevronDown className="mt-px size-3 shrink-0 text-[var(--primary)]" aria-hidden />
                                ) : (
                                  <ChevronRight className="mt-px size-3 shrink-0 text-[var(--primary)]" aria-hidden />
                                )}
                                {detail.departmentName}
                              </button>
                              {isExpanded ? (
                                <div className="mt-1 pl-0 flex flex-wrap gap-1">
                                  {detail.codes.split(", ").map((code) => (
                                    <span
                                      key={code}
                                      className="rounded-[6px] border border-[#d7dbe7] bg-white px-2 py-0.5 text-[10px] text-[#555f76] whitespace-nowrap"
                                    >
                                      {code}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      row.assignedMultiCodes
                    )}
                  </TableCell>
                  {canUpdateUser && (
                    <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center">
                      <button
                        type="button"
                        onClick={() => onEditRow(row)}
                        className="inline-flex cursor-pointer items-center opacity-80 drop-shadow-[0_1px_0_rgba(108,93,211,0.35)] transition-opacity hover:opacity-100"
                      >
                        <img
                          src={tableEditIcon}
                          alt=""
                          aria-hidden="true"
                          className="size-[12.1px] object-contain"
                        />
                      </button>
                    </TableCell>
                  )}
                  {showSwitchUser ? (
                    <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center">
                      <button
                        type="button"
                        onClick={() => onSwitchUser(row)}
                        className="inline-flex cursor-pointer items-center drop-shadow-[0_1px_0_rgba(108,93,211,0.35)] transition-opacity hover:opacity-100"
                      >
                        <img
                          src={tableSwitchUserIcon}
                          alt=""
                          aria-hidden="true"
                          className="h-[18px] w-[18px] object-contain"
                        />
                      </button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
          {!isLoading && sortedRows.length === 0 ? (
            <TableRow className="h-[210px] hover:bg-transparent">
              <TableCell colSpan={headers.length} className="text-center">
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
  </>
  )
}

