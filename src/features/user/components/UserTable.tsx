import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
} from "lucide-react"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
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
import { type UserModuleRow } from "@/features/user/types"

type UserTableProps = {
  rows: UserModuleRow[]
  isLoading: boolean
  onEditRow: (row: UserModuleRow) => void
}

type SortDirection = "asc" | "desc"

export function UserTable({ rows, isLoading, onEditRow }: UserTableProps) {
  const [expandedRowIds, setExpandedRowIds] = useState<Record<string, boolean>>({})
  const [employeeSortDirection, setEmployeeSortDirection] =
    useState<SortDirection>("asc")
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
  const dividerClass = "border-r border-[1px] border-[#8f86f0]"

  const skeletonRows = Array.from(
    { length: 10 },
    (_, index) => `skeleton-row-${index}`
  )
  const sortedRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) =>
      a.employee.localeCompare(b.employee, undefined, { sensitivity: "base" })
    )
    return employeeSortDirection === "asc" ? sorted : sorted.reverse()
  }, [rows, employeeSortDirection])

  return (
    <div className="overflow-hidden rounded-[4px] border border-[#e6e7ef]">
      <Table>
        <TableHeader className="[&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent">
            {headers.map((header, idx) => (
              <TableHead
                key={header}
                className={`h-10 ${dividerClass} bg-[var(--primary)] p-[12px] text-[11px] font-medium text-white last:border-r-0 ${
                  idx >= 3 ? "text-center" : ""
                }`}
              >
                {idx === 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setEmployeeSortDirection((prev) =>
                        prev === "asc" ? "desc" : "asc"
                      )
                    }
                    className="inline-flex w-full cursor-pointer items-center justify-between gap-1.5"
                  >
                    <span>{header}</span>
                    <span className="ml-1 inline-flex flex-col items-center leading-none">
                      <ChevronUp
                        className={`size-[10px] ${
                          employeeSortDirection === "asc"
                            ? "text-white"
                            : "text-white/50"
                        }`}
                      />
                      <ChevronDown
                        className={`-mt-1 size-[10px] ${
                          employeeSortDirection === "desc"
                            ? "text-white"
                            : "text-white/50"
                        }`}
                      />
                    </span>
                  </button>
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
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-[12px] text-[#232735]">
                    {row.employee}
                  </TableCell>
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-[12px] text-[#232735]">
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
                        {(row.roleAssignments ?? ["User"]).map((role) => (
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
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-[11px] leading-[1.1rem] text-[#232735]">
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
                  <TableCell className="border-r border-[#eff0f5] px-[14px] py-[5px] text-center text-[12px] text-[#232735]">
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
                  <TableCell className="px-[14px] py-[5px] text-center">
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
        </TableBody>
      </Table>
    </div>
  )
}
