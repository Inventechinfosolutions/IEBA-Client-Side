import { Eye, Trash2 } from "lucide-react"

import editIconImg from "@/assets/edit-icon.png"
import statusCheckImg from "@/assets/status-check.png"
import statusCrossImg from "@/assets/status-cross.png"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ParticipantsListRow } from "../types"

export type ParticipantsListCardViewProps = {
  rows: ParticipantsListRow[]
  isLoading: boolean
  onEditRow: (row: ParticipantsListRow) => void
  onDeleteRow: (row: ParticipantsListRow) => void
  onViewUsers: (row: ParticipantsListRow) => void
  isDeletingId?: number | null
}

export function ParticipantsListCardView({
  rows,
  isLoading,
  onEditRow,
  onDeleteRow,
  onViewUsers,
  isDeletingId,
}: ParticipantsListCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={`participants-card-skeleton-${idx}`}
              className="rounded-[10px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
            >
              <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
                <div className="h-4 w-1/3 rounded bg-white/40" />
                <div className="h-5 w-12 rounded bg-white/40" />
              </div>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
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
            No participant groups found
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rows.map((row) => (
            <div
              key={`participants-card-${row.id}`}
              className="participants-card rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
            >
              {/* Header - Group Name & Action Buttons */}
              <div className="flex items-center justify-between bg-[#6C5DD3] px-4 py-3 text-white gap-2">
                <span className="font-bold text-[14px] truncate text-white">
                  {row.groupName}
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  {row.isUsed === true ? (
                    <>
                      <span
                        className="inline-flex shrink-0 cursor-not-allowed opacity-80 p-1"
                        title="This participant group is already in use"
                      >
                        <img
                          src={statusCrossImg}
                          alt="Disabled"
                          className="size-[16px] object-contain brightness-0 invert"
                        />
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onViewUsers(row)}
                        className="size-7 shrink-0 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1"
                        aria-label={`View users in ${row.groupName}`}
                      >
                        <Eye className="size-[16px] text-white" strokeWidth={2} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditRow(row)}
                        className="size-7 shrink-0 cursor-pointer rounded-[6px] text-white bg-transparent hover:bg-white/20 p-1"
                        aria-label={`Edit ${row.groupName}`}
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
                        aria-label={`Delete ${row.groupName}`}
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

              {/* Body */}
              <div className="p-4 space-y-3 flex-1 bg-white dark:bg-[#0c0d12]">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-1">
                      Job Pool
                    </span>
                    <div className="flex justify-center pt-0.5">
                      {row.jobPool ? (
                        <img
                          src={statusCheckImg}
                          alt="Yes"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      ) : (
                        <img
                          src={statusCrossImg}
                          alt="No"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-1">
                      Cost Pool
                    </span>
                    <div className="flex justify-center pt-0.5">
                      {row.costPool ? (
                        <img
                          src={statusCheckImg}
                          alt="Yes"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      ) : (
                        <img
                          src={statusCrossImg}
                          alt="No"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[10px] tracking-wider block mb-1">
                      User
                    </span>
                    <div className="flex justify-center pt-0.5">
                      {row.user ? (
                        <img
                          src={statusCheckImg}
                          alt="Yes"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      ) : (
                        <img
                          src={statusCrossImg}
                          alt="No"
                          aria-hidden="true"
                          className="size-[16px] object-contain"
                        />
                      )}
                    </div>
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
