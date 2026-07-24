import { Trash2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

import tableCheckIcon from "@/assets/icons/table-check.png"
import tableCloseIcon from "@/assets/icons/table-close.png"
import tableEditIcon from "@/assets/icons/table-edit.png"

import { isoYmdToDisplayDdMmYyyy, isHolidayIsoDateTodayOrFuture } from "./fiscalYearDateUtils"
import type { FiscalYearTableProps } from "./types"

export function FiscalYearCardView({
  holidays,
  isLoading,
  onEditRow,
  onRemoveRow,
}: FiscalYearTableProps) {
  if (isLoading) {
    return (
      <div className="mt-3 flex items-center justify-center gap-2 rounded-[6px] border border-[#e7e9f2] bg-white py-6">
        <Spinner className="text-[#6C5DD3]" />
        <span className="text-[12px] text-[#6b7280]">Loading holidays…</span>
      </div>
    )
  }

  if (holidays.length === 0) {
    return (
      <div className="mt-3 rounded-[6px] border border-[#e7e9f2] bg-white py-6 text-center text-[12px] text-[#6b7280]">
        No holidays added
      </div>
    )
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {holidays.map((row) => {
        const showHolidayActions = isHolidayIsoDateTodayOrFuture(row.dateIso)
        return (
          <div
            key={row.id}
            className="overflow-hidden rounded-[8px] border border-[#e7e9f2] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
          >
            {/* Card header — matches table header purple */}
            <div className="flex items-center justify-between bg-[var(--primary)] px-4 py-2">
              <span className="text-[12px] font-medium text-white">
                {isoYmdToDisplayDdMmYyyy(row.dateIso)}
              </span>

              {/* Action icons in header */}
              <div className="flex items-center gap-0.5">
                {showHolidayActions ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onEditRow(row)}
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-[4px] hover:bg-white/20"
                      aria-label="Edit holiday"
                    >
                      <img src={tableEditIcon} alt="Edit" className="size-3 brightness-0 invert" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveRow(row.id)}
                      className="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-[4px] text-white hover:bg-white/20"
                      aria-label="Delete holiday"
                    >
                      <Trash2 className="size-3 stroke-[1.75]" aria-hidden />
                    </button>
                  </>
                ) : (
                  /* Placeholder to keep header height consistent */
                  <span className="h-6 w-14" />
                )}
              </div>
            </div>

            {/* Card body */}
            <div className="flex items-center justify-between gap-2 px-4 py-3">
              {/* Holiday name */}
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[11px] font-bold text-[#111827]">
                  Holiday
                </span>
                <span className="truncate text-[12px] font-normal text-[#6b7280]">
                  {row.description}
                </span>
              </div>

              {/* Optional badge */}
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="text-[11px] font-bold text-[#111827]">
                  Optional
                </span>
                <span
                  className="inline-flex size-5 items-center justify-center"
                  aria-label={row.optional ? "Optional" : "Not optional"}
                >
                  <img
                    src={row.optional ? tableCheckIcon : tableCloseIcon}
                    alt=""
                    className="size-3.5 object-contain"
                    aria-hidden
                  />
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
