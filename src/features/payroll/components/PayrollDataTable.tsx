import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

import type { PayrollDataTableProps, PayrollManagementRow } from "../types"

/** Matches `PayrollDetailsSection` Card shell (border + radius; no extra shadow inside page card). */
const payrollTableCardClass =
  "rounded-[8px] border border-[#e7e9f2] bg-white shadow-none ring-0"

const PAYROLL_TABLE_COLUMNS: { key: keyof PayrollManagementRow; label: string }[] = [
  { key: "employeeId", label: "Employee ID" },
  { key: "employeeFirstName", label: "First Name" },
  { key: "employeeMiddleName", label: "Middle Name" },
  { key: "employeeLastName", label: "Last Name" },
  { key: "suffix", label: "Suffix" },
  { key: "department", label: "Department" },
  { key: "bargainingUnit", label: "Bargaining Unit" },
  { key: "type", label: "Type" },
  { key: "position", label: "Position" },
  { key: "payPeriodBegin", label: "Pay Period Begin" },
  { key: "payPeriodEnd", label: "Pay Period End" },
  { key: "checkDate", label: "Check Date" },
  { key: "fica", label: "FICA" },
  { key: "pers", label: "PERS" },
  { key: "defComp", label: "Def Comp" },
  { key: "cafeteria", label: "Cafeteria" },
  { key: "lifeInsurance", label: "Life Insurance" },
  { key: "standby", label: "Standby" },
  { key: "spa", label: "SPA" },
  { key: "cellStipend", label: "Cell Stipend" },
  { key: "std", label: "STD" },
  { key: "ot", label: "OT" },
  { key: "recruitingIncentive", label: "Recruiting Incentive" },
  { key: "cashOut", label: "Cash Out" },
  { key: "payout", label: "Payout" },
  { key: "salary", label: "Salary" },
]

/** Horizontal scroll for wide grid; keeps page width fixed (matches payroll card). */
const tableScrollClass =
  "box-border w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]"

const thBaseClass =
  "h-11 min-w-[120px] whitespace-nowrap border-b border-[#e7e9f2] bg-[var(--primary)] px-3 text-left text-[12px] font-medium text-white"

const tdBaseClass =
  "min-w-[120px] whitespace-nowrap border-b border-[#eef0f5] px-3 py-2 text-left text-[12px] text-[#111827]"

const colCount = PAYROLL_TABLE_COLUMNS.length

const SKELETON_ROW_COUNT = 8

/** Vary bar widths so skeleton rows don’t look perfectly uniform. */
function payrollSkeletonBarClass(colIndex: number, rowIndex: number): string {
  const pattern = (colIndex + rowIndex * 5) % 7
  const widthClass =
    pattern === 0
      ? "max-w-[min(100%,5.5rem)]"
      : pattern === 1
        ? "max-w-[min(100%,7rem)]"
        : pattern === 2
          ? "max-w-[min(100%,4rem)]"
          : pattern === 3
            ? "max-w-[min(100%,6rem)]"
            : pattern === 4
              ? "max-w-[min(100%,5rem)]"
              : pattern === 5
                ? "max-w-[min(100%,8rem)]"
                : "max-w-[min(100%,6.5rem)]"
  return cn("h-3.5 w-full rounded-[4px] bg-[#e8eaf2]", widthClass)
}

function rowKey(row: PayrollManagementRow, index: number): string {
  return `${row.employeeId}-${row.payPeriodBegin}-${row.checkDate}-${index}`
}

function PayrollHeaderRow() {
  return (
    <TableHeader className="[&_tr]:border-b-0">
      <TableRow className="border-0 hover:bg-transparent">
        {PAYROLL_TABLE_COLUMNS.map((col, index) => {
          const isLast = index === PAYROLL_TABLE_COLUMNS.length - 1
          return (
            <TableHead
              key={col.key}
              className={cn(
                thBaseClass,
                isLast ? "border-r-0" : "border-r border-white/50",
              )}
            >
              {col.label}
            </TableHead>
          )
        })}
      </TableRow>
    </TableHeader>
  )
}

export function PayrollDataTable({ rows, isLoading }: PayrollDataTableProps) {
  const showEmptyBody = !isLoading && rows.length === 0

  if (showEmptyBody) {
    return (
      <div className={cn(tableScrollClass, payrollTableCardClass)}>
        <table className="w-max min-w-full border-collapse text-left text-[12px]">
          <PayrollHeaderRow />
          <TableBody>
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={colCount} className="border-0 p-0 align-middle">
                <div
                  className="grid min-h-[220px] w-full min-w-full grid-cols-3 items-center border-t border-[#eef0f5] bg-white py-12"
                  role="status"
                  aria-label="No payroll data"
                >
                  <div className="flex justify-start pl-9 sm:pl-170">
                    <img
                      src={tableEmptyIcon}
                      alt=""
                      aria-hidden
                      className="size-27 object-contain opacity-80 sm:size-27"
                    />
                  </div>
                  <div className="flex justify-end pl-9 sm:pl-2-0">
                    <img
                      src={tableEmptyIcon}
                      alt=""
                      aria-hidden
                      className="size-27 object-contain opacity-80 sm:size-27"
                    />
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </table>
      </div>
    )
  }

  return (
    <div className={cn(tableScrollClass, payrollTableCardClass)}>
      <table className="w-max min-w-full border-collapse text-left text-[12px]">
        <PayrollHeaderRow />
        <TableBody aria-busy={isLoading}>
          {isLoading ? (
            Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIndex) => (
              <TableRow
                key={`payroll-skeleton-${rowIndex}`}
                className="border-[#eef0f5] hover:bg-transparent"
              >
                {PAYROLL_TABLE_COLUMNS.map((col, colIndex) => {
                  const isLastCol = colIndex === PAYROLL_TABLE_COLUMNS.length - 1
                  return (
                    <TableCell
                      key={col.key}
                      className={cn(
                        tdBaseClass,
                        isLastCol ? "border-r-0" : "border-r border-[#eff0f5]",
                      )}
                    >
                      {rowIndex === 0 && colIndex === 0 ? (
                        <span className="sr-only">Loading payroll data</span>
                      ) : null}
                      <Skeleton className={payrollSkeletonBarClass(colIndex, rowIndex)} aria-hidden />
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          ) : (
            rows.map((row, index) => (
              <TableRow key={rowKey(row, index)} className="border-[#eef0f5]">
                {PAYROLL_TABLE_COLUMNS.map((col, colIndex) => {
                  const isLastCol = colIndex === PAYROLL_TABLE_COLUMNS.length - 1
                  return (
                    <TableCell
                      key={col.key}
                      className={cn(
                        tdBaseClass,
                        isLastCol ? "border-r-0" : "border-r border-[#eff0f5]",
                      )}
                    >
                      {row[col.key]}
                    </TableCell>
                  )
                })}
              </TableRow>
            ))
          )}
        </TableBody>
      </table>
    </div>
  )
}
