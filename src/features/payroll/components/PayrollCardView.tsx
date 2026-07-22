import type { PayrollManagementRow } from "../types"
import { Button } from "@/components/ui/button"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import { cn } from "@/lib/utils"

export type PayrollCardViewProps = {
  rows: readonly PayrollManagementRow[]
  isLoading?: boolean
  columns: readonly string[]
  onEditRow?: (row: PayrollManagementRow) => void
  showEditAction?: boolean
}

function labelToDataKey(label: string): string {
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

export function PayrollCardView({
  rows,
  isLoading,
  columns,
  onEditRow,
  showEditAction = true,
}: PayrollCardViewProps) {
  const derivedColumns = columns.map((col) => ({
    label: col,
    dataKey: labelToDataKey(col),
  }))

  if (isLoading) {
    return (
      <div className="block xl:hidden space-y-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`payroll-card-skeleton-${idx}`}
            className="rounded-[10px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
          >
            <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
              <div className="h-4 w-1/3 rounded bg-white/40" />
              <div className="h-5 w-8 rounded bg-white/40" />
            </div>
            <div className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="block xl:hidden rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[160px] w-full">
        <img
          src={tableEmptyIcon}
          alt="No data"
          aria-hidden="true"
          className="mx-auto size-20 object-contain opacity-80"
        />
        <p className="mt-2 text-[13px] text-gray-500 dark:text-zinc-400">No payroll records found</p>
      </div>
    )
  }

  return (
    <div className="block xl:hidden space-y-4">
      {rows.map((row, index) => {
        const rawRow = row as unknown as Record<string, unknown>
        const rowId = String(rawRow.id ?? rawRow.payrollmanagementid ?? rawRow.payrollManagementId ?? index)
        
        // Find a primary label for the header (e.g. Employee ID or Name or First Column value)
        const firstCol = derivedColumns[0]
        const headerTitle = firstCol
          ? `${firstCol.label}: ${toCellText(rawRow[firstCol.dataKey]) || "N/A"}`
          : `Payroll Record #${index + 1}`

        return (
          <div
            key={`payroll-card-${rowId}-${index}`}
            className="payroll-card rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] dark:ring-1 dark:ring-[#6C5DD3] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
          >
            {/* Card Header: Purple Background */}
            <div className="flex items-center justify-between bg-[#6C5DD3] px-5 py-3 text-white">
              <span className="font-bold text-[14px] truncate max-w-[85%]">
                {headerTitle}
              </span>
              {showEditAction && onEditRow ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onEditRow(row)}
                  className="size-7 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 dark:bg-transparent dark:hover:bg-white/20 p-1"
                  aria-label="Edit row"
                >
                  <img
                    src={tableEditIcon}
                    alt="Edit"
                    aria-hidden="true"
                    className="size-[16px] object-contain brightness-0 invert"
                  />
                </Button>
              ) : null}
            </div>

            {/* Card Body: Key-value rows aligned to left and right */}
            <div className="p-4 space-y-1 flex-1 bg-white dark:bg-[#0c0d12]">
              {derivedColumns.map((col) => {
                const val = toCellText(rawRow[col.dataKey])
                return (
                  <div
                    key={col.dataKey}
                    className="flex items-center justify-between gap-3 border-b border-gray-100 dark:border-[rgba(108,93,211,0.25)] py-2 text-[12px]"
                  >
                    <span className="text-[#6b7280] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider shrink-0 max-w-[55%] truncate">
                      {col.label}:
                    </span>
                    <span className="font-medium text-[#111827] dark:text-white text-[12px] text-right break-words min-w-0">
                      {val || "—"}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
