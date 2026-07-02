import tableEmptyIcon from "@/assets/icons/table-empty.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import { Skeleton } from "@/components/ui/skeleton"
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"

import type { PayrollDataTableProps, PayrollManagementRow } from "../types"

/** Matches `PayrollDetailsSection` Card shell (border + radius; no extra shadow inside page card). */
const payrollTableCardClass =
  "rounded-[8px] border border-[#e7e9f2] bg-white shadow-none ring-0"

/** Horizontal scroll for wide grid; keeps page width fixed (matches payroll card). */
const tableScrollClass =
  "box-border w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain [scrollbar-gutter:stable]"

const thBaseClass =
  "h-11 min-w-[120px] whitespace-nowrap border-b border-[#e7e9f2] bg-[var(--primary)] px-3 text-left text-[12px] font-medium text-white"

const tdBaseClass =
  "min-w-[120px] whitespace-nowrap border-b border-[#eef0f5] px-3 py-2 text-left text-[12px] text-[#111827]"

const actionThClass = "min-w-[84px] px-3 text-center border-l border-white/50"
const actionTdClass = "min-w-[84px] px-3 py-2 text-center border-l border-[#eff0f5]"

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

type PayrollColumn = { label: string; dataKey: string }

function labelToDataKey(label: string): string {
  // Backend row payload uses lowercase keys like "employeeid", "payperiodbegin", etc.
  // We derive the cell key from the configured column label so renamed/added columns
  // can be shown without changing frontend code.
  return label.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function toCellText(value: unknown): string {
  if (value === null || value === undefined) return ""
  if (typeof value === "string") return value
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value)
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function PayrollHeaderRow({ columns }: { columns: readonly PayrollColumn[] }) {
  return (
    <TableHeader className="[&_tr]:border-b-0">
      <TableRow className="border-0 hover:bg-transparent">
        {columns.map((col, index) => {
          const isLast = index === columns.length - 1
          return (
            <TableHead
              key={`${col.dataKey}-${index}`}
              className={cn(
                thBaseClass,
                isLast ? "border-r-0" : "border-r border-white/50",
              )}
            >
              {col.label}
            </TableHead>
          )
        })}
        <TableHead className={cn(thBaseClass, actionThClass, "border-r-0")}>Action</TableHead>
      </TableRow>
    </TableHeader>
  )
}

export function PayrollDataTable({ rows, isLoading, columns, onEditRow, showEditAction = true }: PayrollDataTableProps) {
  const derivedColumns: PayrollColumn[] =
    columns && columns.length > 0
      ? columns.map((c) => ({ label: c, dataKey: labelToDataKey(c) }))
      : []

  const colCount = derivedColumns.length + 1

  return (
    <div className="space-y-4">
      {/* Desktop View Table */}
      <div className="hidden xl:block">
        <div className={cn(tableScrollClass, payrollTableCardClass, "relative")}>
          {isLoading && (
            <div className="absolute inset-x-0 bottom-0 top-[44px] z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
              <Spinner className="text-[#6C5DD3]" />
            </div>
          )}
          <table className="w-max min-w-full border-collapse text-left text-[12px]">
            <PayrollHeaderRow columns={derivedColumns} />
            <TableBody aria-busy={isLoading}>
              {isLoading ? (
                Array.from({ length: SKELETON_ROW_COUNT }, (_, rowIndex) => (
                  <TableRow
                    key={`payroll-skeleton-${rowIndex}`}
                    className="border-[#eef0f5] hover:bg-transparent"
                  >
                    {derivedColumns.map((col, colIndex) => {
                      const isLastCol = colIndex === derivedColumns.length - 1
                      return (
                        <TableCell
                          key={`${col.dataKey}-${colIndex}`}
                          className={cn(
                            tdBaseClass,
                            isLastCol ? "border-r-0" : "border-r border-[#eff0f5]",
                          )}
                        >
                          <Skeleton className={payrollSkeletonBarClass(colIndex, rowIndex)} aria-hidden />
                        </TableCell>
                      )
                    })}
                    <TableCell className={cn(tdBaseClass, actionTdClass, "border-r-0")}>
                      <Skeleton className={cn("h-7 w-7 rounded-[6px] bg-[#e8eaf2] mx-auto")} aria-hidden />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow className="h-[220px] bg-white hover:bg-white transition-none">
                  <TableCell colSpan={colCount} className="text-center align-middle">
                    <div className="flex flex-col items-center justify-center py-12">
                      <img
                        src={tableEmptyIcon}
                        alt="No data"
                        aria-hidden="true"
                        className="mx-auto h-[85px] w-auto object-contain opacity-80"
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => (
                  <TableRow key={rowKey(row, index)} className="border-[#eef0f5] hover:bg-[#fafafa]">
                    {derivedColumns.map((col, colIndex) => {
                      const isLastCol = colIndex === derivedColumns.length - 1
                      return (
                        <TableCell
                          key={`${col.dataKey}-${colIndex}`}
                          className={cn(
                            tdBaseClass,
                            isLastCol ? "border-r-0" : "border-r border-[#eff0f5]",
                          )}
                        >
                          {toCellText((row as unknown as Record<string, unknown>)[col.dataKey])}
                        </TableCell>
                      )
                    })}
                    <TableCell className={cn(tdBaseClass, actionTdClass, "border-r-0")}>
                      {showEditAction ? (
                        <button
                          type="button"
                          onClick={() => onEditRow?.(row)}
                          className={cn(
                            "inline-flex items-center justify-center rounded-[6px] bg-transparent p-1",
                            "hover:bg-[#f7f7fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25",
                            onEditRow ? "cursor-pointer" : "opacity-60 cursor-default hover:bg-transparent",
                          )}
                          aria-label="Edit row"
                          disabled={!onEditRow}
                        >
                          <img src={tableEditIcon} alt="" aria-hidden className="size-4 object-contain" />
                        </button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>
      </div>

      {/* Mobile/Tablet Cards View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 xl:hidden bg-[#F9FAFB] p-4 rounded-[8px] border border-[#e7e9f2]">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[10px] border border-[#E5E7EB] bg-white p-5 space-y-4 animate-pulse">
              <Skeleton className="h-6 w-1/3 rounded bg-gray-200 animate-pulse" />
              <Skeleton className="h-4 w-2/3 rounded bg-gray-200 animate-pulse" />
              <Skeleton className="h-4 w-full rounded bg-gray-200 animate-pulse" />
            </div>
          ))
        ) : rows.length === 0 ? (
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white p-8 text-center flex flex-col items-center justify-center min-h-[150px] w-full col-span-full">
            <img
              src={tableEmptyIcon}
              alt="No data"
              aria-hidden="true"
              className="mx-auto h-[85px] w-auto object-contain opacity-80"
            />
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={rowKey(row, index)}
              className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden text-[13px] text-[#111827] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-[#6C5DD3] px-5 py-3 text-white">
                <span className="font-bold text-[14px]">
                  {toCellText((row as unknown as Record<string, unknown>)[derivedColumns[0]?.dataKey]) || "Payroll Record"}
                </span>
                {showEditAction && onEditRow && (
                  <button
                    type="button"
                    onClick={() => onEditRow?.(row)}
                    className="inline-flex cursor-pointer items-center justify-center p-1 rounded hover:bg-white/10"
                    aria-label="Edit row"
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

              {/* Body */}
              <div className="p-5 space-y-3.5 flex-1">
                {derivedColumns.slice(1).map((col, colIndex) => {
                  const val = toCellText((row as unknown as Record<string, unknown>)[col.dataKey])
                  return (
                    <div key={`${col.dataKey}-${colIndex}`} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-b-0 last:pb-0">
                      <span className="text-[#111827] font-bold uppercase text-[11px] tracking-wider">{col.label}:</span>
                      <span className="font-normal text-gray-600 text-right text-[13px] whitespace-normal break-words max-w-[60%]">{val || "—"}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
