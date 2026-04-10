import type { CSSProperties } from "react"
import { Trash2 } from "lucide-react"

import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"

import { isoYmdToDisplayDdMmYyyy, isHolidayIsoDateTodayOrFuture } from "./fiscalYearDateUtils"
import type { FiscalYearTableProps } from "./types"
import { holidayTableBodyScrollMaxHeight } from "./types"

const holidayTableHeadClassName = "h-10"
const holidayTableBodyRowClassName = "min-h-[40px]"
/** Must match header row height for `maxHeight` on the scroll container. */
const HOLIDAY_TABLE_HEADER_ROW_PX = 40

const cellBorder = "border-r border-[#eceff5] last:border-r-0"
const headCellBorder = "border-r border-white/25 last:border-r-0"

function HolidayTableColGroup() {
  return (
    <colgroup>
      <col style={{ width: "22%" }} />
      <col style={{ width: "46%" }} />
      <col style={{ width: "16%" }} />
      <col style={{ width: "16%" }} />
    </colgroup>
  )
}

export function FiscalYearTable({
  holidays,
  isLoading,
  onEditRow,
  onRemoveRow,
}: FiscalYearTableProps) {
  const scrollWrapStyle: CSSProperties = {
    maxHeight: `calc(${HOLIDAY_TABLE_HEADER_ROW_PX}px + ${holidayTableBodyScrollMaxHeight})`,
    scrollbarGutter: "stable",
  }

  const bodyRows = (
    <>
      {isLoading ? (
        <TableRow className={`${holidayTableBodyRowClassName} border-b border-[#e9ecf3] hover:bg-white`}>
          <TableCell colSpan={4} className="border-0 px-3 py-3 text-center text-[12px] text-[#6b7280]">
            Loading holidays…
          </TableCell>
        </TableRow>
      ) : holidays.length === 0 ? (
        <TableRow className={`${holidayTableBodyRowClassName} border-b border-[#e9ecf3] hover:bg-white`}>
          <TableCell colSpan={4} className="border-0 px-3 py-3 text-center text-[12px] text-[#6b7280]">
            No holidays added
          </TableCell>
        </TableRow>
      ) : (
        holidays.map((row) => {
          const showHolidayActions = isHolidayIsoDateTodayOrFuture(row.dateIso)
          return (
            <TableRow
              key={row.id}
              className={`${holidayTableBodyRowClassName} border-b border-[#e9ecf3] hover:bg-white`}
            >
              <TableCell
                className={cn(
                  cellBorder,
                  "px-3 py-2 text-center align-middle text-[12px] text-[#111827]",
                )}
              >
                {isoYmdToDisplayDdMmYyyy(row.dateIso)}
              </TableCell>
              <TableCell
                className={cn(
                  cellBorder,
                  "min-w-0 px-3 py-2 text-center align-middle text-[12px] text-[#111827] break-words whitespace-normal",
                )}
              >
                {row.description}
              </TableCell>
              <TableCell className={cn(cellBorder, "px-2 py-2 text-center align-middle")}>
                <span
                  className="inline-flex size-7 items-center justify-center"
                  aria-label={row.optional ? "Optional" : "Not optional"}
                >
                  <img
                    src={row.optional ? tableCheckIcon : tableCloseIcon}
                    alt=""
                    className="size-3.5 object-contain"
                    aria-hidden
                  />
                </span>
              </TableCell>
              <TableCell className="px-2 py-2 text-center align-middle">
                {showHolidayActions ? (
                  <div className="flex items-center justify-center gap-0">
                    <button
                      type="button"
                      onClick={() => onEditRow(row)}
                      className="inline-flex h-7 cursor-pointer items-center justify-center rounded-[6px] p-0"
                      aria-label="Edit holiday row"
                    >
                      <img src={tableEditIcon} alt="Edit row" className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveRow(row.id)}
                      className="inline-flex h-7 cursor-pointer items-center justify-center rounded-[6px] p-0 text-red-600"
                      aria-label="Delete holiday row"
                    >
                      <Trash2 className="size-3.5 stroke-[1.75]" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </TableCell>
            </TableRow>
          )
        })
      )}
    </>
  )

  return (
    <div className="mt-3 overflow-hidden rounded-[6px] border border-[#e7e9f2] bg-white">
      <div className="overflow-x-auto overflow-y-auto" style={scrollWrapStyle}>
        <table className="w-full min-w-[600px] border-collapse text-[12px] table-fixed">
          <HolidayTableColGroup />
          <TableHeader className="sticky top-0 z-10 bg-[var(--primary)] [&_tr]:border-b">
            <TableRow className="border-0 hover:bg-[var(--primary)]">
              <TableHead
                className={cn(
                  holidayTableHeadClassName,
                  headCellBorder,
                  "rounded-tl-[6px] px-3 py-2 text-center text-[12px] font-medium text-white",
                )}
              >
                Date
              </TableHead>
              <TableHead
                className={cn(
                  holidayTableHeadClassName,
                  headCellBorder,
                  "px-3 py-2 text-center text-[12px] font-medium text-white",
                )}
              >
                Holiday
              </TableHead>
              <TableHead
                className={cn(
                  holidayTableHeadClassName,
                  headCellBorder,
                  "px-3 py-2 text-center text-[12px] font-medium text-white",
                )}
              >
                Optional
              </TableHead>
              <TableHead
                className={cn(
                  holidayTableHeadClassName,
                  "rounded-tr-[6px] px-3 py-2 text-center text-[12px] font-medium text-white",
                )}
              >
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white">{bodyRows}</TableBody>
        </table>
      </div>
    </div>
  )
}
