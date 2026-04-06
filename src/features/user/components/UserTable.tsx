import { useMemo, useState } from "react"
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
import type { UserTableProps, UserTableSortState } from "@/features/user/types"

export function UserTable({ rows, isLoading, onEditRow }: UserTableProps) {
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const [employeeSortState, setEmployeeSortState] = useState<UserTableSortState>("none")
  const [isEmployeeTooltipOpen, setIsEmployeeTooltipOpen] = useState(false)
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
    "Action",
    "Switch User",
  ]

  const skeletonRows = Array.from(
    { length: 10 },
    (_, index) => `skeleton-row-${index}`
  )
  const sortedRows = useMemo(() => {
    if (employeeSortState === "none") return rows

    const sorted = [...rows].sort((a, b) =>
      a.employee.localeCompare(b.employee, undefined, { sensitivity: "base" })
    )
    return employeeSortState === "asc" ? sorted : sorted.reverse()
  }, [rows, employeeSortState])

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#e6e7ef]">
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
          <col style={{ width: "75px" }} />
          <col style={{ width: "55px" }} />
          <col style={{ width: "70px" }} />
        </colgroup>
        <TableHeader className="[&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent">
            {headers.map((header, idx) => (
              <TableHead
                key={header}
                className={`h-10 bg-[var(--primary)] p-[8px] text-[12px] leading-[1.15] font-medium text-white whitespace-normal break-words ${
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
                            setEmployeeSortState((prev) =>
                              prev === "none" ? "asc" : prev === "asc" ? "desc" : "none"
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
                                employeeSortState === "asc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                            <ChevronDown
                              className={`-mt-1 size-[10px] ${
                                employeeSortState === "desc"
                                  ? "text-white"
                                  : "text-white/50"
                              }`}
                            />
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        {employeeSortState === "none"
                          ? "Click to sort ascending"
                          : employeeSortState === "asc"
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
                  className="border-b border-[#eff0f5] hover:bg-transparent"
                >
                  <TableCell className="align-top border-r border-[#eff0f5] px-[14px] py-[5px] text-[12px] text-[#232735] whitespace-normal break-words">
                    {row.employee}
                  </TableCell>
                  <TableCell className="align-top border-r border-[#eff0f5] px-[14px] py-[5px] text-[12px] text-[#232735] whitespace-normal break-words">
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1"
                      onClick={() =>
                        setExpandedRowIds((prev) => ({
                          ...prev,
                          [row.id]: !prev[row.id],
                        }))
                      }
                    >
                      {expandedRowIds[row.id] ? (
                        <ChevronDown className="size-3 text-[var(--primary)]" />
                      ) : (
                        <ChevronRight className="size-3 text-[var(--primary)]" />
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
                  <TableCell className="align-top border-r border-[#eff0f5] px-[14px] py-[5px] text-center text-[12px] text-[#232735] whitespace-normal break-words">
                    {row.assignedMultiCodes}
                  </TableCell>
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
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center">
                    <button
                      type="button"
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
  )
}

