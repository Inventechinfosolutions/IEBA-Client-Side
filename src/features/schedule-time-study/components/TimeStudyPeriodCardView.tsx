import dayjs from "dayjs"

import editIconImg from "@/assets/edit-icon.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ScheduleTimeStudyPeriodRow } from "../types"

export type TimeStudyPeriodCardViewProps = {
  rows: ScheduleTimeStudyPeriodRow[]
  isLoading: boolean
  onEditRow: (row: ScheduleTimeStudyPeriodRow) => void
  onDeleteRow: (row: ScheduleTimeStudyPeriodRow) => void
  isDeletingId?: number | null
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  if (dayjs(dateStr).isValid() && dateStr.includes("T")) {
    return dayjs(dateStr).format("MM-DD-YYYY")
  }
  return dateStr
}

export function TimeStudyPeriodCardView({
  rows,
  isLoading,
  onEditRow,
  onDeleteRow,
  isDeletingId,
}: TimeStudyPeriodCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`period-card-skeleton-${idx}`}
              className="rounded-[10px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
            >
              <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
                <div className="h-4 w-1/3 rounded bg-white/40" />
                <div className="h-5 w-12 rounded bg-white/40" />
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[150px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[13px] text-gray-500 dark:text-zinc-400">
            No time study periods found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((row) => (
            <div
              key={`period-card-${row.id}`}
              className="period-card rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-3 text-white gap-2">
                <span className="font-bold text-[14px] truncate text-white">
                  {row.timeStudyPeriod}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  {row.isUsed === true ? (
                    <span
                      className="inline-flex shrink-0 cursor-not-allowed opacity-50 p-1"
                      title="Time Study Period is already in use"
                      aria-label="Time Study Period is already in use"
                    >
                      <Trash2 className="size-[16px] text-white" />
                    </span>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditRow(row)}
                        className="size-7 shrink-0 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 dark:bg-transparent dark:hover:bg-white/20 p-1"
                        aria-label={`Edit ${row.timeStudyPeriod}`}
                      >
                        <img
                          src={editIconImg}
                          alt="Edit"
                          className="size-[16px] object-contain brightness-0 invert"
                        />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteRow(row)}
                        disabled={isDeletingId === Number(row.id)}
                        className="size-7 shrink-0 cursor-pointer rounded-[6px] text-red-200 bg-transparent hover:bg-white/20 p-1"
                        aria-label={`Delete ${row.timeStudyPeriod}`}
                      >
                        {isDeletingId === Number(row.id) ? (
                          <Spinner className="size-3.5 text-white" />
                        ) : (
                          <Trash2 className="size-[16px] text-white" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Body - 2 Column Alignment */}
              <div className="p-4 space-y-3 flex-1 bg-white dark:bg-[#0c0d12]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      Start Date
                    </span>
                    <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7]">
                      {formatDate(row.startDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      End Date
                    </span>
                    <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7]">
                      {formatDate(row.endDate)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      Hours
                    </span>
                    <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7]">
                      {row.hours ?? "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      Holidays
                    </span>
                    <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7]">
                      {row.holidays ?? "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      Allocable
                    </span>
                    <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7]">
                      {row.allocable ?? "—"}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      Non-Allocable
                    </span>
                    <span className="font-normal text-[13px] text-[#232735] dark:text-[#e4e4e7]">
                      {row.nonAllocable ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
