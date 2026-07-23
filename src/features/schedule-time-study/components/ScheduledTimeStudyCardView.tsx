import dayjs from "dayjs"
import { Trash2 } from "lucide-react"

import editIconImg from "@/assets/edit-icon.png"
import statusCrossImg from "@/assets/status-cross.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ScheduledTimeStudyRowEnriched } from "../types"
import { SchedulePayPeriodGroupStatus } from "../enums/schedule-time-study.enum"

export type ScheduledTimeStudyCardViewProps = {
  rows: ScheduledTimeStudyRowEnriched[]
  isLoading: boolean
  onEditRow: (row: ScheduledTimeStudyRowEnriched) => void
  onDeleteRow: (row: ScheduledTimeStudyRowEnriched) => void
  canUpdateSchedule: boolean
  isDeletingId?: number | null
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—"
  if (dayjs(dateStr).isValid() && dateStr.includes("T")) {
    return dayjs(dateStr).format("MM-DD-YYYY")
  }
  return dateStr
}

function renderStatusBadge(status?: SchedulePayPeriodGroupStatus | string) {
  if (!status) return "—"
  switch (status) {
    case SchedulePayPeriodGroupStatus.PUBLISHED:
      return <span className="inline-flex rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 px-2.5 py-0.5 text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800">Published</span>
    case SchedulePayPeriodGroupStatus.DRAFT:
      return <span className="inline-flex rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 px-2.5 py-0.5 text-[11px] font-semibold border border-amber-200 dark:border-amber-800">Draft</span>
    case SchedulePayPeriodGroupStatus.INACTIVE:
      return <span className="inline-flex rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2.5 py-0.5 text-[11px] font-semibold border border-gray-200 dark:border-gray-700">Inactive</span>
    default:
      return <span className="text-[#9ca3af]">{status}</span>
  }
}

export function ScheduledTimeStudyCardView({
  rows,
  isLoading,
  onEditRow,
  onDeleteRow,
  canUpdateSchedule,
  isDeletingId,
}: ScheduledTimeStudyCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`scheduled-card-skeleton-${idx}`}
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
            No scheduled time studies found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((row) => (
            <div
              key={`scheduled-card-${row.id}`}
              className="scheduled-card rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-3 text-white gap-2">
                <span className="font-bold text-[14px] truncate text-white">
                  {row.timeStudyPeriod}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  {row.statusRaw === SchedulePayPeriodGroupStatus.DRAFT && canUpdateSchedule && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onEditRow(row)}
                      className="size-7 shrink-0 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1"
                      aria-label={`Edit ${row.timeStudyPeriod}`}
                    >
                      <img
                        src={editIconImg}
                        alt="Edit"
                        className="size-[16px] object-contain brightness-0 invert"
                      />
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (row.statusRaw !== SchedulePayPeriodGroupStatus.DRAFT) return
                      onDeleteRow(row)
                    }}
                    disabled={isDeletingId === Number(row.id) || row.statusRaw !== SchedulePayPeriodGroupStatus.DRAFT}
                    className="size-7 shrink-0 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={`Delete ${row.timeStudyPeriod}`}
                  >
                    {isDeletingId === Number(row.id) ? (
                      <Spinner className="size-3.5 text-white" />
                    ) : row.statusRaw === SchedulePayPeriodGroupStatus.DRAFT ? (
                      <Trash2 className="size-[16px] text-white" />
                    ) : (
                      <img
                        src={statusCrossImg}
                        alt="Disabled"
                        className="size-[16px] object-contain brightness-0 invert"
                      />
                    )}
                  </Button>
                </div>
              </div>

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 bg-white dark:bg-[#0c0d12]">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gray-100 dark:border-zinc-800 pb-2.5">
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
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      Status
                    </span>
                    <div className="pt-0.5">
                      {renderStatusBadge(row.statusRaw || row.status)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-0.5">
                      Groups
                    </span>
                    <span className="font-semibold text-[13px] text-[#232735] dark:text-[#e4e4e7] wrap-break-word">
                      {row.groups || "—"}
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
