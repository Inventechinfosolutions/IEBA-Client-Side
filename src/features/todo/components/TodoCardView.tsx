import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import tableEmptyIcon from "@/assets/icons/table-empty.png"
import tableEditIcon from "@/assets/icons/table-edit.png"
import { TodoStatusEnum } from "../enums/todoStatus"
import { TODO_STATUS_LABEL } from "../types"
import type { TodoRow } from "../types"

export type TodoCardViewProps = {
  rows: TodoRow[]
  isLoading?: boolean
  onEditRow: (row: TodoRow) => void
  footer?: ReactNode
}

function getStatusPillClasses(status: TodoRow["status"]) {
  if (status === TodoStatusEnum.NEW) {
    return "border-[#d1d5db] text-[#4b5563] bg-white dark:bg-zinc-800 dark:text-white dark:border-[#52525b]"
  }
  if (status === TodoStatusEnum.INPROGRESS) {
    return "border-[#f59e0b] text-[#f59e0b] bg-white dark:bg-[#291e0a] dark:text-[#f59e0b] dark:border-[#f59e0b]"
  }
  return "border-[#16a34a] text-[#16a34a] bg-white dark:bg-[#052e16] dark:text-[#4ade80] dark:border-[#16a34a]"
}

export function TodoCardView({
  rows,
  isLoading,
  onEditRow,
  footer,
}: TodoCardViewProps) {
  return (
    <div className="block xl:hidden space-y-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={`todo-card-skeleton-${idx}`}
            className="rounded-[10px] border border-gray-200 dark:border-[#27272a] bg-white dark:bg-[#0c0d12] overflow-hidden animate-pulse"
          >
            <div className="h-12 bg-[#6C5DD3] px-5 py-3 flex justify-between items-center">
              <div className="h-4 w-1/3 rounded bg-white/40" />
              <div className="h-5 w-16 rounded bg-white/40" />
            </div>
            <div className="p-5 space-y-3.5">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-zinc-800" />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        ))
      ) : rows.length === 0 ? (
        <div className="rounded-[10px] border border-[#E5E7EB] dark:border-[#27272a] bg-white dark:bg-[#0c0d12] p-8 text-center flex flex-col items-center justify-center min-h-[150px] w-full">
          <img
            src={tableEmptyIcon}
            alt="No data"
            aria-hidden="true"
            className="mx-auto h-[73px] w-[82px] object-contain opacity-80"
          />
          <p className="mt-2 text-[13px] text-gray-500 dark:text-zinc-400">No To Do items found</p>
        </div>
      ) : (
        rows.map((row) => (
          <div
            key={`mobile-todo-${row.id}`}
            className="todo-card rounded-[10px] border border-[#E5E7EB] dark:border-[rgba(108,93,211,0.55)] bg-white dark:bg-[#0c0d12] shadow-sm dark:shadow-[0_2px_12px_rgba(108,93,211,0.12)] overflow-hidden text-[13px] text-[#111827] dark:text-white flex flex-col"
          >
            {/* Card Header: PURPLE background in both dark & light modes */}
            <div className="flex items-center justify-between bg-[#6C5DD3] px-5 py-3 text-white">
              <span className="font-bold text-[14px] truncate max-w-[80%]">
                {row.title}
              </span>
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
            </div>

            {/* Card Body: Light background in light mode, dark in dark mode */}
            <div className="p-5 space-y-3.5 flex-1 bg-white dark:bg-[#0c0d12]">
              {/* Description */}
              <div className="flex flex-col gap-1 border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2.5">
                <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider">
                  Description:
                </span>
                <span className="font-normal text-gray-600 dark:text-[#e5e7eb] text-left text-[13px] whitespace-pre-wrap break-words w-full">
                  {row.description || "—"}
                </span>
              </div>

              {/* Created Date & Completed Date Grid */}
              <div className="grid grid-cols-2 gap-3 border-b border-gray-100 dark:border-[rgba(108,93,211,0.3)] pb-2.5">
                <div className="flex flex-col gap-1">
                  <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider">
                    Created Date:
                  </span>
                  <span className="font-normal text-gray-600 dark:text-[#e5e7eb] text-[13px]">
                    {row.createdDate || "—"}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider">
                    Completed Date:
                  </span>
                  <span className="font-normal text-gray-600 dark:text-[#e5e7eb] text-[13px]">
                    {row.completedDate || "—"}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-[#111827] dark:text-[#9ca3af] font-bold uppercase text-[11px] tracking-wider">
                  Status:
                </span>
                <span
                  className={`status-pill status-${row.status} inline-flex h-[22px] min-w-[53px] items-center justify-center rounded-[8px] border px-2 text-center text-[11px] font-medium ${getStatusPillClasses(
                    row.status
                  )}`}
                >
                  {TODO_STATUS_LABEL[row.status]}
                </span>
              </div>
            </div>
          </div>
        ))
      )}

      {footer && (
        <div className="mt-4">
          {footer}
        </div>
      )}
    </div>
  )
}
